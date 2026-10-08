// Validation de la demande de paiement envoyée par le navigateur et
// messages d'erreur affichés au client.

import { HttpError } from "./http.ts";
import type { Customer, OrderRow, Provider } from "./db.ts";

export interface CheckoutInput {
  /** condition : état de la ligne de stock (« neuf », « occasion-6 ») ; vide = la première de la pointure */
  items: { slug: string; size: string; condition: string; qty: number }[];
  customer: Customer;
  shipping: string;
  provider: Provider;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: unknown): s is string => typeof s === "string" && UUID.test(s);

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const CONDITION = /^(neuf|occasion-\d{1,2})$/;

export function parseCheckout(body: unknown): CheckoutInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const bad = (msg: string) => new HttpError(400, "invalid_request", msg);

  if (!Array.isArray(b.items) || b.items.length === 0 || b.items.length > 20) throw bad("Panier vide ou invalide.");
  const items = b.items.map((i) => {
    const it = (i ?? {}) as Record<string, unknown>;
    const qty = Number(it.qty);
    const condition = str(it.condition, 20);
    if (
      !str(it.slug, 200) || !str(it.size, 10) || !Number.isInteger(qty) || qty < 1 || qty > 5 ||
      (condition && !CONDITION.test(condition))
    ) {
      throw bad("Ligne de panier invalide.");
    }
    return { slug: str(it.slug, 200), size: str(it.size, 10), condition, qty };
  });

  const c = (b.customer ?? {}) as Record<string, unknown>;
  const customer: Customer = {
    email: str(c.email, 200),
    phone: str(c.phone, 30),
    firstName: str(c.firstName, 80),
    lastName: str(c.lastName, 80),
    address: str(c.address, 200),
    zip: str(c.zip, 12),
    city: str(c.city, 100),
  };
  for (const [k, v] of Object.entries(customer)) if (!v) throw bad(`Champ manquant : ${k}.`);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email)) throw bad("Adresse e-mail invalide.");

  const shipping = str(b.shipping, 20);
  if (!["relais", "colissimo", "express"].includes(shipping)) throw bad("Mode de livraison inconnu.");
  const provider = b.provider === "stripe" || b.provider === "paypal" ? b.provider : null;
  if (!provider) throw bad("Moyen de paiement inconnu.");

  return { items, customer, shipping, provider };
}

/** Message lisible pour une erreur SQL de create_order. */
export function orderErrorMessage(code: string): string {
  switch (code) {
    case "out_of_stock":
      return "Une paire de ton panier vient d'être vendue ou réservée. Actualise la page pour voir le stock à jour.";
    case "unknown_product":
    case "unknown_size":
      return "Une paire de ton panier n'est plus en ligne. Retire-la pour continuer.";
    case "invalid_email":
      return "Adresse e-mail invalide.";
    default:
      return "La commande n'a pas pu être créée. Réessaie dans un instant.";
  }
}

/** Ce que le navigateur de l'acheteur a le droit de voir de sa commande. */
export function publicOrder(o: OrderRow) {
  return {
    id: o.id,
    number: o.number,
    status: o.status,
    provider: o.provider,
    items: o.items.map(({ slug, name, colorway, size, condition, qty, price }) => ({
      slug,
      name,
      colorway,
      size,
      condition,
      qty,
      price,
    })),
    subtotal: o.subtotal,
    shippingMethod: o.shipping_method,
    shippingPrice: o.shipping_price,
    total: o.total,
    email: o.customer.email,
    firstName: o.customer.firstName,
    address: `${o.customer.address}, ${o.customer.zip} ${o.customer.city}`,
  };
}

export const SHIPPING_LABELS: Record<string, string> = {
  relais: "Point relais",
  colissimo: "Domicile (Colissimo)",
  express: "Express (Chronopost)",
};

/** « Neuf », « Occasion 6/10 » */
export const conditionLabel = (code: string) => (code === "neuf" ? "Neuf" : `Occasion ${code.split("-")[1]}/10`);

/** libellé d'une ligne sur la page de paiement : « Dunk Low — EU 42 · Occasion 6/10 » */
export const lineLabel = (i: { name: string; size: string; condition?: string }) => {
  const size = i.size === "TU" ? "Taille unique" : `EU ${i.size}`;
  return `${i.name} — ${size}${i.condition ? ` · ${conditionLabel(i.condition)}` : ""}`;
};
export const cents = (n: number) => Math.round(n * 100);
export const money = (n: number) => n.toFixed(2);
