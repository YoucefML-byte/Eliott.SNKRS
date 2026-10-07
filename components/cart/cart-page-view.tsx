"use client";

import Link from "next/link";

import { ProductGrid } from "@/components/product/product-grid";
import { buttonVariants } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { useCatalog } from "@/lib/catalog/provider";
import { formatPrice } from "@/lib/format";
import { availability } from "@/lib/products";

import { CartLineItem } from "./cart-line";
import { ShippingProgress } from "./shipping-progress";

export function CartPageView() {
  const cart = useCart();
  const { products } = useCatalog();
  const suggestions = products
    .filter((p) => availability(p) !== "soldout" && !cart.lines.some((l) => l.slug === p.slug))
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-[1360px] px-4 pb-24 pt-8 md:px-8 md:pt-14">
      <h1 className="font-display text-5xl font-medium uppercase tracking-tight md:text-7xl">Panier</h1>

      {!cart.ready ? (
        <div className="mt-10 h-40 animate-pulse rounded-md bg-surface" />
      ) : cart.lines.length === 0 ? (
        <div className="mt-10 rounded-md border border-line px-6 py-16 text-center">
          <p className="font-display text-2xl uppercase">Ton panier est vide</p>
          <p className="mt-3 text-muted">Choisis une pièce dans le stock pour commencer.</p>
          <Link href="/catalogue" className={buttonVariants({ className: "mt-8" })}>
            Voir le stock
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-16">
          <ul className="divide-y divide-line border-y border-line">
            {cart.lines.map((l) => (
              <CartLineItem key={l.slug + l.size} line={l} large />
            ))}
          </ul>

          <aside className="h-fit rounded-md border border-line bg-surface p-6 lg:sticky lg:top-24">
            <h2 className="label text-ink">Récapitulatif</h2>
            <dl className="mt-5 grid gap-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">
                  Sous-total ({cart.count} article{cart.count > 1 ? "s" : ""})
                </dt>
                <dd className="font-mono tabular-nums">{formatPrice(cart.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Livraison</dt>
                <dd className="text-muted">Étape suivante</dd>
              </div>
            </dl>
            <div className="my-5 border-t border-line" />
            <ShippingProgress subtotal={cart.subtotal} />
            <Link href="/checkout" className={buttonVariants({ size: "lg", className: "mt-6 w-full" })}>
              Passer commande
            </Link>
            <Link href="/catalogue" className={buttonVariants({ variant: "link", className: "mt-4 w-full" })}>
              Continuer mes achats
            </Link>
          </aside>
        </div>
      )}

      {suggestions.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-8 font-display text-3xl font-medium uppercase tracking-tight">Les pièces fortes du moment</h2>
          <ProductGrid products={suggestions} />
        </section>
      )}
    </div>
  );
}
