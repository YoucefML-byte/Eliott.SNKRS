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
  removePair: (product: Product) => Promise<void>;
  /** admin "add a pair" panel, opened from the header */
  formOpen: boolean;
  setFormOpen: (open: boolean) => void;
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
  const [formOpen, setFormOpen] = useState(false);

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
    formOpen,
    setFormOpen,
    signIn: async (email, password) => setAdmin(await catalogBackend.signIn(email, password)),
    signOut: async () => {
      await catalogBackend.signOut();
      setAdmin(null);
      setFormOpen(false);
    },
    addPair: async (input) => {
      const product = await catalogBackend.create(input);
      setProducts((list) => [product, ...list]);
      return product;
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
