"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { PRODUCTS } from "@/data/products";
import type { Product } from "@/data/types";

import { catalogBackend } from ".";
import type { AdminUser, NewPairInput } from "./types";

interface CatalogApi {
  products: Product[];
  /** true once the live catalogue has loaded (the bundled pairs show until then) */
  ready: boolean;
  error: string | null;
  mode: "demo" | "supabase";
  admin: AdminUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  addPair: (input: NewPairInput) => Promise<Product>;
  updatePair: (product: Product, input: NewPairInput) => Promise<Product>;
  removePair: (product: Product) => Promise<void>;
  /** admin "add an article" panel, opened from the header */
  formOpen: boolean;
  setFormOpen: (open: boolean) => void;
  /** article being edited in that panel (null: a new one) */
  editing: Product | null;
  /** opens the panel on an existing article */
  editPair: (product: Product) => void;
}

const CatalogContext = createContext<CatalogApi | null>(null);

// In Supabase mode the bundled pairs are only a placeholder until the
// database answers; in demo mode they are the catalogue.
const initial = catalogBackend.mode === "demo" ? PRODUCTS : [];

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initial);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });

  useEffect(() => {
    let alive = true;
    catalogBackend
      .list()
      .then(
        (list) => alive && (setProducts(list), setError(null)),
        (e) => alive && setError(e instanceof Error ? e.message : "Impossible de charger le stock."),
      )
      .finally(() => alive && setReady(true));
    catalogBackend.currentAdmin().then(
      (user) => alive && setAdmin(user),
      () => alive && setAdmin(null),
    );
    return () => {
      alive = false;
    };
  }, []);

  const api: CatalogApi = {
    products,
    ready,
    error,
    mode: catalogBackend.mode,
    admin,
    formOpen: form.open,
    setFormOpen: (open) => setForm({ open, product: null }),
    editing: form.product,
    editPair: (product) => setForm({ open: true, product }),
    signIn: async (email, password) => setAdmin(await catalogBackend.signIn(email, password)),
    signOut: async () => {
      await catalogBackend.signOut();
      setAdmin(null);
      setForm({ open: false, product: null });
    },
    addPair: async (input) => {
      const product = await catalogBackend.create(input);
      setProducts((list) => [product, ...list]);
      return product;
    },
    updatePair: async (product, input) => {
      const next = await catalogBackend.update(product, input);
      setProducts((list) => list.map((p) => (p.slug === product.slug ? next : p)));
      return next;
    },
    removePair: async (product) => {
      await catalogBackend.remove(product);
      setProducts((list) => list.filter((p) => p.slug !== product.slug));
    },
  };

  return <CatalogContext.Provider value={api}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used inside <CatalogProvider>");
  return ctx;
}
