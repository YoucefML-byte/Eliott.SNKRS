"use client";

import type { ReactNode } from "react";

import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartProvider } from "@/lib/cart";

import { AnnouncementBar } from "./announcement-bar";
import { Header } from "./header";

/** Providers + éléments communs à toutes les pages. */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <AnnouncementBar />
      <Header />
      <main className="min-h-[70vh]">{children}</main>
      <CartDrawer />
    </CartProvider>
  );
}
