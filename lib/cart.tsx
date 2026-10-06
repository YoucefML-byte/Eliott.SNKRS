"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

import type { Product, SizeOption } from "@/data/types";

import { useCatalog } from "./catalog/provider";
import { recordDemoOrder } from "./orders";
import { findProduct } from "./products";

// Panier gardé dans le navigateur (localStorage). En mode démo, la commande est
// aussi simulée ici ; en paiement réel, elle est créée par lib/payment.ts.

export interface CartLine {
  slug: string;
  size: string;
  qty: number;
}

export interface ResolvedLine extends CartLine {
  product: Product;
  option: SizeOption;
  total: number;
}

export interface Order {
  number: string;
  lines: ResolvedLine[];
  subtotal: number;
  shipping: { label: string; price: number };
  total: number;
  email: string;
  name: string;
  address: string;
  phone?: string;
  payment?: string;
}

type State = { lines: CartLine[]; open: boolean; ready: boolean; lastOrder: Order | null };

type Action =
  | { type: "hydrate"; lines: CartLine[]; lastOrder: Order | null }
  | { type: "add"; slug: string; size: string; max: number }
  | { type: "qty"; slug: string; size: string; qty: number; max: number }
  | { type: "remove"; slug: string; size: string }
  | { type: "open"; open: boolean }
  | { type: "clear" }
  | { type: "order"; order: Order };

const KEY = "eliott-cart-v1";
const ORDER_KEY = "eliott-order-v1";

const same = (l: CartLine, slug: string, size: string) => l.slug === slug && l.size === size;

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case "hydrate":
      return { ...state, lines: a.lines, lastOrder: a.lastOrder, ready: true };
    case "add": {
      const { max } = a;
      const existing = state.lines.find((l) => same(l, a.slug, a.size));
      const lines = existing
        ? state.lines.map((l) =>
            same(l, a.slug, a.size) ? { ...l, qty: Math.min(l.qty + 1, max) } : l,
          )
        : [...state.lines, { slug: a.slug, size: a.size, qty: 1 }];
      return { ...state, lines, open: true };
    }
    case "qty": {
      const qty = Math.max(1, Math.min(a.qty, a.max));
      return {
        ...state,
        lines: state.lines.map((l) => (same(l, a.slug, a.size) ? { ...l, qty } : l)),
      };
    }
    case "remove":
      return { ...state, lines: state.lines.filter((l) => !same(l, a.slug, a.size)) };
    case "open":
      return { ...state, open: a.open };
    case "clear":
      return { ...state, lines: [], open: false };
    case "order":
      return { ...state, lines: [], open: false, lastOrder: a.order };
  }
}

function resolve(lines: CartLine[], products: Product[]): ResolvedLine[] {
  return lines.flatMap((l) => {
    const product = findProduct(products, l.slug);
    const option = product?.sizes.find((s) => s.size === l.size);
    if (!product || !option) return [];
    return [{ ...l, product, option, total: product.price * l.qty }];
  });
}

function read<T>(storage: () => Storage, key: string, fallback: T): T {
  try {
    const raw = storage().getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(storage: () => Storage, key: string, value: unknown) {
  try {
    storage().setItem(key, JSON.stringify(value));
  } catch {
    // stockage indisponible (navigation privée) : le panier reste en mémoire
  }
}

interface CartApi {
  lines: ResolvedLine[];
  count: number;
  subtotal: number;
  open: boolean;
  ready: boolean;
  lastOrder: Order | null;
  add: (slug: string, size: string) => void;
  setQty: (slug: string, size: string, qty: number) => void;
  remove: (slug: string, size: string) => void;
  setOpen: (open: boolean) => void;
  /** vide le panier (paiement réel confirmé) */
  clear: () => void;
  placeOrder: (order: Omit<Order, "lines" | "subtotal" | "number" | "total">) => Order;
}

const CartContext = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    lines: [],
    open: false,
    ready: false,
    lastOrder: null,
  });

  useEffect(() => {
    dispatch({
      type: "hydrate",
      lines: read(() => localStorage, KEY, []),
      lastOrder: read(() => sessionStorage, ORDER_KEY, null),
    });
  }, []);

  useEffect(() => {
    if (state.ready) write(() => localStorage, KEY, state.lines);
  }, [state.lines, state.ready]);

  const { products } = useCatalog();
  const stockOf = (slug: string, size: string) =>
    findProduct(products, slug)?.sizes.find((s) => s.size === size)?.stock ?? 0;
  const lines = useMemo(() => resolve(state.lines, products), [state.lines, products]);
  const subtotal = lines.reduce((n, l) => n + l.total, 0);
  const count = lines.reduce((n, l) => n + l.qty, 0);

  const placeOrder = useCallback<CartApi["placeOrder"]>(
    (details) => {
      const order: Order = {
        ...details,
        number: `ES-${Math.floor(10000 + Math.random() * 89999)}`,
        lines,
        subtotal,
        total: subtotal + details.shipping.price,
      };
      write(() => sessionStorage, ORDER_KEY, order);
      recordDemoOrder(order);
      dispatch({ type: "order", order });
      return order;
    },
    [lines, subtotal],
  );

  const clear = useCallback(() => dispatch({ type: "clear" }), []);

  const api: CartApi = {
    lines,
    count,
    subtotal,
    open: state.open,
    ready: state.ready,
    lastOrder: state.lastOrder,
    add: (slug, size) => dispatch({ type: "add", slug, size, max: stockOf(slug, size) }),
    setQty: (slug, size, qty) => dispatch({ type: "qty", slug, size, qty, max: stockOf(slug, size) }),
    remove: (slug, size) => dispatch({ type: "remove", slug, size }),
    setOpen: (open) => dispatch({ type: "open", open }),
    clear,
    placeOrder,
  };

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
