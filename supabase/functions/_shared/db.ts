// Accès à la base via l'API REST de Supabase avec la clé serveur
// (service_role) : seule cette clé peut appeler les fonctions SQL de
// supabase/payments.sql. Elle ne quitte jamais le serveur.

import type { Fetch } from "./http.ts";

export interface OrderItem {
  slug: string;
  name: string;
  brand: string;
  colorway: string;
  size: string;
  qty: number;
  price: number;
}

export interface Customer {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address: string;
  zip: string;
  city: string;
}

export type OrderStatus = "pending" | "paid" | "shipped" | "cancelled";
export type Provider = "stripe" | "paypal";

export interface OrderRow {
  id: string;
  number: string;
  status: OrderStatus;
  provider: Provider;
  provider_ref: string | null;
  items: OrderItem[];
  subtotal: number;
  shipping_method: string;
  shipping_price: number;
  total: number;
  customer: Customer;
  reserved_until: string;
  created_at: string;
  paid_at: string | null;
}

export interface Db {
  createOrder(items: unknown, customer: unknown, shipping: string, provider: Provider): Promise<OrderRow>;
  getOrder(id: string): Promise<OrderRow | null>;
  setProviderRef(id: string, ref: string): Promise<void>;
  markPaid(id: string, ref: string | null): Promise<OrderRow>;
  cancel(id: string): Promise<void>;
}

/** Erreur levée par une fonction SQL, ex. « out_of_stock:slug:42 ». */
export class DbError extends Error {
  code: string;
  constructor(message: string) {
    super(message);
    this.code = message.split(":")[0];
  }
}

export function restDb(url: string, key: string, fetchFn: Fetch = fetch): Db {
  const headers: Record<string, string> = { apikey: key, "content-type": "application/json" };
  // anciennes clés (JWT) : aussi en Authorization ; nouvelles clés sb_secret_ : apikey seul
  if (key.startsWith("eyJ")) headers.authorization = `Bearer ${key}`;
  const base = url.replace(/\/$/, "") + "/rest/v1";

  async function call<T>(path: string, init: RequestInit): Promise<T> {
    const res = await fetchFn(base + path, { ...init, headers: { ...headers, ...init.headers } });
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    if (!res.ok) throw new DbError(body?.message ?? `HTTP ${res.status}`);
    return body as T;
  }
  const rpc = <T>(fn: string, args: unknown) => call<T>(`/rpc/${fn}`, { method: "POST", body: JSON.stringify(args) });
  const num = (r: OrderRow): OrderRow => ({
    ...r,
    subtotal: Number(r.subtotal),
    shipping_price: Number(r.shipping_price),
    total: Number(r.total),
    items: r.items.map((i) => ({ ...i, price: Number(i.price) })),
  });

  return {
    async createOrder(items, customer, shipping, provider) {
      return num(
        await rpc<OrderRow>("create_order", {
          p_items: items,
          p_customer: customer,
          p_shipping: shipping,
          p_provider: provider,
        }),
      );
    },
    async getOrder(id) {
      const rows = await call<OrderRow[]>(`/orders?id=eq.${encodeURIComponent(id)}&select=*`, { method: "GET" });
      return rows[0] ? num(rows[0]) : null;
    },
    async setProviderRef(id, ref) {
      await call(`/orders?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ provider_ref: ref }),
        headers: { prefer: "return=minimal" },
      });
    },
    async markPaid(id, ref) {
      return num(await rpc<OrderRow>("mark_order_paid", { p_order: id, p_ref: ref }));
    },
    async cancel(id) {
      await rpc("cancel_order", { p_order: id });
    },
  };
}
