"use client";

import { Check } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { SITE } from "@/data/site";
import { useCart } from "@/lib/cart";

import { OrderSummary } from "./order-summary";

export function ConfirmationView() {
  const { lastOrder: order, ready } = useCart();

  if (!ready) return <div className="h-[60vh]" />;

  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl uppercase">Aucune commande récente</h1>
        <Link href="/catalogue" className={buttonVariants({ className: "mt-8" })}>
          Voir le stock
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-[1080px] gap-12 px-4 pb-24 pt-12 md:px-8 md:pt-20 lg:grid-cols-[1fr_400px]">
      <div>
        <span className="grid size-14 place-items-center rounded-full bg-acc text-ground">
          <Check className="size-7" strokeWidth={2.5} />
        </span>
        <p className="label mt-8 text-acc">Commande {order.number}</p>
        <h1 className="mt-3 font-display text-5xl font-medium uppercase leading-none tracking-tight md:text-6xl">
          Merci {order.name.split(" ")[0]} !
        </h1>
        <p className="mt-6 max-w-md leading-relaxed text-muted">
          Ta commande est confirmée. Eliott vérifie chaque paire avant l&apos;envoi ; tu recevras le numéro de suivi
          par e-mail à <span className="text-ink">{order.email}</span>.
        </p>

        <ol className="mt-10 grid gap-0 border-l border-line pl-6">
          {[
            ["Commande reçue", "À l'instant"],
            ["Authentification et emballage", "Sous 24 h"],
            [`Expédition · ${order.shipping.label}`, "Sous 48 h"],
          ].map(([t, d], i) => (
            <li key={t} className="relative pb-6">
              <span
                className={`absolute -left-[29px] top-1 size-2.5 rounded-full ${i === 0 ? "bg-acc" : "border border-dim bg-ground"}`}
              />
              <p className="text-[15px]">{t}</p>
              <p className="text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/catalogue" className={buttonVariants()}>
            Continuer mes achats
          </Link>
          <a href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline" })}>
            Suivre @{SITE.instagram}
          </a>
        </div>
      </div>

      <aside className="h-fit rounded-md border border-line bg-surface p-6">
        <h2 className="label mb-2 text-ink">Livraison</h2>
        <p className="mb-6 text-sm text-muted">{order.address}</p>
        <OrderSummary lines={order.lines} subtotal={order.subtotal} shipping={order.shipping.price} />
      </aside>
    </div>
  );
}
