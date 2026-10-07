"use client";

import { X } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

import { CartLineItem } from "./cart-line";
import { ShippingProgress } from "./shipping-progress";

export function CartDrawer() {
  const cart = useCart();
  const close = () => cart.setOpen(false);

  return (
    <Sheet open={cart.open} onClose={close} label="Panier">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-display text-xl font-medium uppercase">
          Panier <span className="font-mono text-sm text-muted">({cart.count})</span>
        </h2>
        <button onClick={close} aria-label="Fermer le panier" className="grid size-10 place-items-center rounded-md hover:bg-raised">
          <X className="size-5" />
        </button>
      </div>

      {cart.lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
          <p className="font-display text-2xl uppercase">Ton panier est vide</p>
          <p className="text-sm text-muted">De nouvelles pièces arrivent chaque semaine.</p>
          <Link href="/catalogue" onClick={close} className={buttonVariants()}>
            Voir le stock
          </Link>
        </div>
      ) : (
        <>
          <div className="border-b border-line px-5 py-4">
            <ShippingProgress subtotal={cart.subtotal} />
          </div>
          <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
            {cart.lines.map((l) => (
              <CartLineItem key={l.slug + l.size} line={l} onNavigate={close} />
            ))}
          </ul>
          <div className="border-t border-line px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">Sous-total</span>
              <span className="font-mono text-lg tabular-nums">{formatPrice(cart.subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-dim">Livraison calculée à l&apos;étape suivante.</p>
            <div className="mt-4 grid gap-2">
              <Link href="/checkout" onClick={close} className={buttonVariants({ size: "lg" })}>
                Commander
              </Link>
              <Link href="/panier" onClick={close} className={buttonVariants({ variant: "outline" })}>
                Voir le panier
              </Link>
            </div>
          </div>
        </>
      )}
    </Sheet>
  );
}
