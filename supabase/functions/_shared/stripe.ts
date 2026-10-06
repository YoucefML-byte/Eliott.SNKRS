// Stripe Checkout via l'API REST (pas de SDK) : page de paiement hébergée par
// Stripe, qui propose carte bancaire, Apple Pay et Google Pay selon ce qui est
// activé dans le tableau de bord Stripe.

import type { OrderRow } from "./db.ts";
import type { Fetch } from "./http.ts";
import { cents, lineLabel, SHIPPING_LABELS } from "./orders.ts";

const API = "https://api.stripe.com/v1";

type Params = Record<string, string | number | undefined>;

/** Paramètres de la session de paiement pour une commande. */
export function checkoutSessionParams(
  order: OrderRow,
  urls: { success: string; cancel: string },
  nowSec: number,
): Params {
  const p: Params = {
    mode: "payment",
    locale: "fr",
    customer_email: order.customer.email,
    client_reference_id: order.id,
    success_url: urls.success,
    cancel_url: urls.cancel,
    // Stripe impose au moins 30 minutes ; une session payée un peu après la fin
    // de la réservation est gérée par mark_order_paid
    expires_at: nowSec + 31 * 60,
    "metadata[order_id]": order.id,
    "metadata[order_number]": order.number,
    "payment_intent_data[description]": `Eliott SNKRS — commande ${order.number}`,
    "payment_intent_data[metadata][order_id]": order.id,
    "payment_intent_data[metadata][order_number]": order.number,
    "shipping_options[0][shipping_rate_data][type]": "fixed_amount",
    "shipping_options[0][shipping_rate_data][display_name]": SHIPPING_LABELS[order.shipping_method] ?? "Livraison",
    "shipping_options[0][shipping_rate_data][fixed_amount][amount]": cents(order.shipping_price),
    "shipping_options[0][shipping_rate_data][fixed_amount][currency]": "eur",
  };
  order.items.forEach((item, i) => {
    const k = `line_items[${i}]`;
    p[`${k}[quantity]`] = item.qty;
    p[`${k}[price_data][currency]`] = "eur";
    p[`${k}[price_data][unit_amount]`] = cents(item.price);
    p[`${k}[price_data][product_data][name]`] = lineLabel(item);
    if (item.colorway) p[`${k}[price_data][product_data][description]`] = item.colorway;
  });
  return p;
}

const form = (p: Params) => {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined) body.append(k, String(v));
  return body;
};

async function stripe<T>(fetchFn: Fetch, key: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetchFn(API + path, {
    ...init,
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/x-www-form-urlencoded",
      "stripe-version": "2024-06-20",
      ...init.headers,
    },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${body?.error?.message ?? "erreur"}`);
  return body as T;
}

export interface StripeSession {
  id: string;
  url: string | null;
  status: "open" | "complete" | "expired";
  payment_status: "paid" | "unpaid" | "no_payment_required";
  client_reference_id: string | null;
  metadata: Record<string, string>;
  amount_total: number | null;
}

export function createCheckoutSession(
  fetchFn: Fetch,
  key: string,
  order: OrderRow,
  urls: { success: string; cancel: string },
  nowSec = Math.floor(Date.now() / 1000),
) {
  return stripe<StripeSession>(fetchFn, key, "/checkout/sessions", {
    method: "POST",
    body: form(checkoutSessionParams(order, urls, nowSec)),
    headers: { "idempotency-key": `checkout-${order.id}` },
  });
}

export const retrieveCheckoutSession = (fetchFn: Fetch, key: string, id: string) =>
  stripe<StripeSession>(fetchFn, key, `/checkout/sessions/${encodeURIComponent(id)}`);

/** Ferme une session encore ouverte (client revenu en arrière). */
export async function expireCheckoutSession(fetchFn: Fetch, key: string, id: string) {
  try {
    await stripe(fetchFn, key, `/checkout/sessions/${encodeURIComponent(id)}/expire`, { method: "POST" });
  } catch {
    // déjà payée ou déjà expirée
  }
}

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function stripeSignature(secret: string, timestamp: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`)));
}

/**
 * Vérifie l'en-tête Stripe-Signature (« t=…,v1=… ») d'un webhook : seul Stripe
 * connaît le secret, donc personne ne peut simuler un paiement.
 */
export async function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  nowSec = Math.floor(Date.now() / 1000),
  toleranceSec = 300,
): Promise<boolean> {
  if (!header) return false;
  const parts = header.split(",").map((p) => p.split("=") as [string, string]);
  const t = parts.find(([k]) => k === "t")?.[1];
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || !sigs.length || !/^\d+$/.test(t)) return false;
  if (Math.abs(nowSec - Number(t)) > toleranceSec) return false;
  const expected = await stripeSignature(secret, t, payload);
  return sigs.some((s) => safeEqual(s, expected));
}
