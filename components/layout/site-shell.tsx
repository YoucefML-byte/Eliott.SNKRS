"use client";

import type { ReactNode } from "react";

import { ProductFormSheet } from "@/components/admin/product-form";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartProvider } from "@/lib/cart";
import { CatalogProvider } from "@/lib/catalog/provider";

import { AnnouncementBar } from "./announcement-bar";
import { Header } from "./header";

/** Providers + éléments communs à toutes les pages. */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <CatalogProvider>
      <CartProvider>
        <AnnouncementBar />
        <Header />
        <main className="min-h-[70vh]">{children}</main>
        <CartDrawer />
        <ProductFormSheet />
      </CartProvider>
    </CatalogProvider>
  );
}
