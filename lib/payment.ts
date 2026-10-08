// Paiement réel : le site appelle les fonctions Supabase (supabase/functions),
// qui créent la commande et la page de paiement Stripe ou PayPal. Aucune donnée
// bancaire ne passe par le site.
//
// Actif seulement si la base est branchée et NEXT_PUBLIC_PAYMENTS_ENABLED=1 ;
// sinon le checkout garde le paiement simulé de la maquette.

import type { ShippingId } from "@/data/site";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const PAYMENTS_LIVE = Boolean(URL_ && KEY && process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "1");

export type Provider = "stripe" | "paypal";

export interface CheckoutCustomer {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address: string;
  zip: string;
  city: string;
}

export interface PublicOrder {
  id: string;
  number: string;
  status: "pending" | "paid" | "shipped" | "cancelled";
  provider: Provider;
  items: { slug: string; name: string; colorway: string; size: string; condition?: string; qty: number; price: number }[];
  subtotal: number;
  shippingMethod: ShippingId;
  shippingPrice: number;
  total: number;
  email: string;
  firstName: string;
  address: string;
}

export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
  }
}

async function call<T>(fn: string, body: unknown): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json", apikey: KEY! };
  if (KEY!.startsWith("eyJ")) headers.authorization = `Bearer ${KEY}`;
  let res: Response;
  try {
    res = await fetch(`${URL_}/functions/v1/${fn}`, { method: "POST", headers, body: JSON.stringify(body) });
  } catch {
    throw new PaymentError("Connexion impossible. Vérifie ta connexion internet et réessaie.", "network");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new PaymentError(data.message ?? "Le paiement est momentanément indisponible.", data.error ?? "server_error");
  }
  return data as T;
}

/** Crée la commande et renvoie l'adresse de la page de paiement Stripe ou PayPal. */
export const startCheckout = (input: {
  /** condition : état de la ligne de stock (« neuf », « occasion-6 ») */
  items: { slug: string; size: string; condition: string; qty: number }[];
  customer: CheckoutCustomer;
  shipping: ShippingId;
  provider: Provider;
}) => call<{ order: { id: string; number: string }; url: string }>("checkout", input);

/** Au retour de Stripe / PayPal : vérifie (et encaisse pour PayPal) le paiement. */
export const confirmOrder = (id: string) =>
  call<{ order: PublicOrder; notice?: "declined" | "expired" }>("confirm-order", { order: id });

/** Le client est revenu sans payer : ses paires sont remises en vente. */
export const cancelOrder = (id: string) => call<{ order: PublicOrder }>("confirm-order", { order: id, action: "cancel" });
