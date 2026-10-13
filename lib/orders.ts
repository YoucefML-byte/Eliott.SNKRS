// Commandes vues par l'admin : table `orders` de Supabase (remplie par les
// fonctions de paiement), ou, en mode démo, les commandes simulées de ce
// navigateur.

import { SHIPPING } from "@/data/site";

import type { Order } from "./cart";
import { catalogBackend } from "./catalog";
import { supabase } from "./catalog/supabase";
import { conditionCode, priceOf } from "./products";

export type OrderStatus = "pending" | "paid" | "shipped" | "cancelled";

export interface AdminOrder {
  id: string;
  number: string;
  status: OrderStatus;
  provider: string;
  createdAt: string;
  /** date du paiement : date de la facture */
  paidAt?: string;
  /** F-2026-00001… attribué au paiement (suite continue, exigée pour les factures) */
  invoiceNumber?: string;
  /** condition : « neuf », « occasion-6 »… (absente des commandes passées avant les états par pointure) */
  items: { slug: string; name: string; colorway?: string; size: string; condition?: string; qty: number; price: number }[];
  subtotal: number;
  shippingLabel: string;
  shippingPrice: number;
  total: number;
  /** address : sur une ligne ; street + cityLine : pour l'étiquette du colis */
  customer: { name: string; email: string; phone: string; address: string; street: string; cityLine: string };
}

/** « 12 rue Oberkampf, 75011 Paris » → rue / code postal + ville */
const splitAddress = (address: string) => {
  const i = address.lastIndexOf(", ");
  return i < 0 ? { street: address, cityLine: "" } : { street: address.slice(0, i), cityLine: address.slice(i + 2) };
};

const invoiceNumber = (n: number, at = new Date()) =>
  `F-${at.toLocaleString("fr-FR", { timeZone: "Europe/Paris", year: "numeric" })}-${String(n).padStart(5, "0")}`;

const DEMO_ORDERS = "eliott-demo-orders-v1";

function readDemo(): AdminOrder[] {
  try {
    const list = JSON.parse(localStorage.getItem(DEMO_ORDERS) ?? "[]") as AdminOrder[];
    // commandes simulées avant l'arrivée des factures et des étiquettes
    return list.map((o) => ({ ...o, customer: { ...splitAddress(o.customer.address), ...o.customer } }));
  } catch {
    return [];
  }
}

function writeDemo(orders: AdminOrder[]) {
  try {
    localStorage.setItem(DEMO_ORDERS, JSON.stringify(orders.slice(0, 50)));
  } catch {
    // stockage plein : la démo continue sans historique
  }
}

/** Mode démo : garde la commande simulée pour l'onglet « Commandes » de l'admin. */
export function recordDemoOrder(o: Order) {
  if (catalogBackend.mode !== "demo") return;
  const previous = readDemo();
  const now = new Date().toISOString();
  writeDemo([
    {
      id: o.number,
      number: o.number,
      status: "paid",
      provider: o.payment ?? "Carte",
      createdAt: now,
      paidAt: now,
      invoiceNumber: invoiceNumber(previous.filter((p) => p.invoiceNumber).length + 1),
      items: o.lines.map((l) => ({
        slug: l.slug,
        name: l.product.name,
        colorway: l.product.colorway,
        size: l.size,
        condition: conditionCode(l.option),
        qty: l.qty,
        price: priceOf(l.product, l.option),
      })),
      subtotal: o.subtotal,
      shippingLabel: o.shipping.label,
      shippingPrice: o.shipping.price,
      total: o.total,
      customer: { name: o.name, email: o.email, phone: o.phone ?? "", address: o.address, ...splitAddress(o.address) },
    },
    ...previous,
  ]);
}

interface Row {
  id: string;
  number: string;
  status: OrderStatus;
  provider: string;
  created_at: string;
  paid_at: string | null;
  invoice_number: string | null;
  items: AdminOrder["items"];
  subtotal: number | string;
  shipping_method: string;
  shipping_price: number | string;
  total: number | string;
  customer: { email: string; phone: string; firstName: string; lastName: string; address: string; zip: string; city: string };
}

const PROVIDERS: Record<string, string> = { stripe: "Stripe", paypal: "PayPal" };

const toOrder = (r: Row): AdminOrder => ({
  id: r.id,
  number: r.number,
  status: r.status,
  provider: PROVIDERS[r.provider] ?? r.provider,
  createdAt: r.created_at,
  paidAt: r.paid_at ?? undefined,
  invoiceNumber: r.invoice_number ?? undefined,
  items: r.items.map((i) => ({ ...i, price: Number(i.price) })),
  subtotal: Number(r.subtotal),
  shippingLabel: SHIPPING.find((s) => s.id === r.shipping_method)?.label ?? r.shipping_method,
  shippingPrice: Number(r.shipping_price),
  total: Number(r.total),
  customer: {
    name: `${r.customer.firstName} ${r.customer.lastName}`,
    email: r.customer.email,
    phone: r.customer.phone,
    address: `${r.customer.address}, ${r.customer.zip} ${r.customer.city}`,
    street: r.customer.address,
    cityLine: `${r.customer.zip} ${r.customer.city}`,
  },
});

/** Commandes payées ou expédiées, les plus récentes d'abord. */
export async function listOrders(): Promise<AdminOrder[]> {
  if (catalogBackend.mode === "demo") return readDemo();
  const sb = await supabase();
  const { data, error } = await sb
    .from("orders")
    .select("*")
    .in("status", ["paid", "shipped"])
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(`Impossible de charger les commandes : ${error.message}`);
  return (data as Row[]).map(toOrder);
}

export async function markShipped(id: string, shipped: boolean): Promise<void> {
  const status: OrderStatus = shipped ? "shipped" : "paid";
  if (catalogBackend.mode === "demo") {
    writeDemo(readDemo().map((o) => (o.id === id ? { ...o, status } : o)));
    return;
  }
  const sb = await supabase();
  const { error } = await sb
    .from("orders")
    .update({ status, shipped_at: shipped ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw new Error(`Mise à jour impossible : ${error.message}`);
}
