// PayPal Checkout (Orders v2) via l'API REST : le client valide le paiement
// chez PayPal, puis revient sur le site où la somme est encaissée (capture).

import type { OrderRow } from "./db.ts";
import type { Fetch } from "./http.ts";
import { lineLabel, money } from "./orders.ts";

export interface PaypalConfig {
  clientId: string;
  secret: string;
  /** « live » pour les vrais paiements, sinon le bac à sable */
  env: string;
}

export const paypalApi = (cfg: PaypalConfig) =>
  cfg.env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

async function token(fetchFn: Fetch, cfg: PaypalConfig): Promise<string> {
  const res = await fetchFn(`${paypalApi(cfg)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      authorization: `Basic ${btoa(`${cfg.clientId}:${cfg.secret}`)}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const body = await res.json();
  if (!res.ok || !body.access_token) throw new Error(`PayPal auth ${res.status}`);
  return body.access_token;
}

interface PaypalError {
  status: number;
  issue?: string;
}

async function paypal<T>(fetchFn: Fetch, cfg: PaypalConfig, path: string, init: RequestInit): Promise<T> {
  const res = await fetchFn(paypalApi(cfg) + path, {
    ...init,
    headers: {
      authorization: `Bearer ${await token(fetchFn, cfg)}`,
      "content-type": "application/json",
      prefer: "return=representation",
      ...init.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, issue: body?.details?.[0]?.issue ?? body?.name } satisfies PaypalError;
  return body as T;
}

const eur = (n: number) => ({ currency_code: "EUR", value: money(n) });

export function paypalOrderBody(order: OrderRow, urls: { success: string; cancel: string }) {
  const c = order.customer;
  return {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: order.number,
        custom_id: order.id,
        invoice_id: order.number,
        description: `Eliott SNKRS — commande ${order.number}`,
        amount: {
          ...eur(order.total),
          breakdown: { item_total: eur(order.subtotal), shipping: eur(order.shipping_price) },
        },
        items: order.items.map((i) => ({
          name: lineLabel(i).slice(0, 127),
          sku: i.slug.slice(0, 127),
          quantity: String(i.qty),
          unit_amount: eur(i.price),
          category: "PHYSICAL_GOODS",
        })),
        shipping: {
          type: "SHIPPING",
          name: { full_name: `${c.firstName} ${c.lastName}`.slice(0, 300) },
          address: { address_line_1: c.address, admin_area_2: c.city, postal_code: c.zip, country_code: "FR" },
        },
      },
    ],
    payment_source: {
      paypal: {
        email_address: c.email,
        experience_context: {
          brand_name: "Eliott SNKRS",
          locale: "fr-FR",
          shipping_preference: "SET_PROVIDED_ADDRESS",
          user_action: "PAY_NOW",
          return_url: urls.success,
          cancel_url: urls.cancel,
        },
      },
    },
  };
}

interface PaypalOrder {
  id: string;
  status: string;
  links?: { rel: string; href: string }[];
  purchase_units?: {
    custom_id?: string;
    payments?: { captures?: { id: string; status: string; amount: { value: string; currency_code: string } }[] };
  }[];
}

export async function createPaypalOrder(
  fetchFn: Fetch,
  cfg: PaypalConfig,
  order: OrderRow,
  urls: { success: string; cancel: string },
) {
  const res = await paypal<PaypalOrder>(fetchFn, cfg, "/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify(paypalOrderBody(order, urls)),
    headers: { "paypal-request-id": `create-${order.id}` },
  });
  const url = res.links?.find((l) => l.rel === "payer-action" || l.rel === "approve")?.href;
  if (!url) throw new Error("PayPal n'a pas renvoyé de lien de paiement");
  return { id: res.id, url };
}

export type CaptureResult =
  | { state: "paid"; captureId: string }
  | { state: "not_approved" }
  | { state: "declined" }
  | { state: "pending" };

function readCapture(o: PaypalOrder, order: OrderRow): CaptureResult {
  const cap = o.purchase_units?.[0]?.payments?.captures?.[0];
  if (o.status !== "COMPLETED" || !cap) return { state: "pending" };
  if (cap.status === "PENDING") return { state: "pending" };
  if (cap.status !== "COMPLETED") return { state: "declined" };
  if (cap.amount.currency_code !== "EUR" || cap.amount.value !== money(order.total)) {
    throw new Error(`Montant PayPal inattendu pour ${order.number}: ${cap.amount.value} ${cap.amount.currency_code}`);
  }
  return { state: "paid", captureId: cap.id };
}

/** Encaisse une commande PayPal validée par le client (sans effet si déjà fait). */
export async function capturePaypalOrder(fetchFn: Fetch, cfg: PaypalConfig, paypalId: string, order: OrderRow) {
  const path = `/v2/checkout/orders/${encodeURIComponent(paypalId)}`;
  try {
    const res = await paypal<PaypalOrder>(fetchFn, cfg, `${path}/capture`, {
      method: "POST",
      body: "{}",
      headers: { "paypal-request-id": `capture-${order.id}` },
    });
    return readCapture(res, order);
  } catch (e) {
    const err = e as PaypalError;
    if (err?.issue === "ORDER_ALREADY_CAPTURED") {
      return readCapture(await paypal<PaypalOrder>(fetchFn, cfg, path, { method: "GET" }), order);
    }
    if (err?.issue === "ORDER_NOT_APPROVED" || err?.issue === "PAYER_ACTION_REQUIRED") {
      return { state: "not_approved" } as const;
    }
    if (err?.issue === "INSTRUMENT_DECLINED" || err?.issue === "TRANSACTION_REFUSED") {
      return { state: "declined" } as const;
    }
    throw e instanceof Error ? e : new Error(`PayPal capture ${err?.status}: ${err?.issue}`);
  }
}
