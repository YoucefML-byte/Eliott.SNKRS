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
import { conditionCode, findOption, findProduct } from "./products";

// Panier gardé dans le navigateur (localStorage). En mode démo, la commande est
// aussi simulée ici ; en paiement réel, elle est créée par lib/payment.ts.

export interface CartLine {
  slug: string;
  size: string;
  /** état de la ligne de stock (« neuf », « occasion-6 ») ; absent dans les anciens paniers */
  condition?: string;
  qty: number;
}

/** ce qui identifie une ligne du panier */
export type LineRef = Pick<CartLine, "slug" | "size" | "condition">;

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
  | { type: "add"; ref: LineRef; max: number }
  | { type: "qty"; ref: LineRef; qty: number; max: number }
  | { type: "remove"; ref: LineRef }
  | { type: "open"; open: boolean }
  | { type: "clear" }
  | { type: "order"; order: Order };

const KEY = "eliott-cart-v1";
const ORDER_KEY = "eliott-order-v1";

const same = (l: LineRef, r: LineRef) =>
  l.slug === r.slug && l.size === r.size && (l.condition ?? "") === (r.condition ?? "");
const refOf = ({ slug, size, condition }: LineRef): LineRef => ({ slug, size, condition });

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case "hydrate":
      return { ...state, lines: a.lines, lastOrder: a.lastOrder, ready: true };
    case "add": {
      const { max } = a;
      const existing = state.lines.find((l) => same(l, a.ref));
      const lines = existing
        ? state.lines.map((l) => (same(l, a.ref) ? { ...l, qty: Math.min(l.qty + 1, max) } : l))
        : [...state.lines, { ...a.ref, qty: 1 }];
      return { ...state, lines, open: true };
    }
    case "qty": {
      const qty = Math.max(1, Math.min(a.qty, a.max));
      return {
        ...state,
        lines: state.lines.map((l) => (same(l, a.ref) ? { ...l, qty } : l)),
      };
    }
    case "remove":
      return { ...state, lines: state.lines.filter((l) => !same(l, a.ref)) };
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
    const option = product && findOption(product, l.size, l.condition);
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
  add: (slug: string, option: SizeOption) => void;
  setQty: (line: LineRef, qty: number) => void;
  remove: (line: LineRef) => void;
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
  const stockOf = (r: LineRef) => {
    const product = findProduct(products, r.slug);
    return (product && findOption(product, r.size, r.condition)?.stock) ?? 0;
  };
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
    add: (slug, option) => {
      const ref = { slug, size: option.size, condition: conditionCode(option) };
      dispatch({ type: "add", ref, max: stockOf(ref) });
    },
    setQty: (line, qty) => dispatch({ type: "qty", ref: refOf(line), qty, max: stockOf(line) }),
    remove: (line) => dispatch({ type: "remove", ref: refOf(line) }),
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
