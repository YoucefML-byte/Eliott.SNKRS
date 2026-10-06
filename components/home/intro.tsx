"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { useCatalog } from "@/lib/catalog/provider";
import { brandsOf, totalStock } from "@/lib/products";

export function Intro() {
  const { products } = useCatalog();
  const stats = [
    { value: products.length, label: "Modèles" },
    { value: products.reduce((n, p) => n + totalStock(p), 0), label: "Paires en stock" },
    { value: brandsOf(products).length, label: "Marques" },
  ];

  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-[1360px] gap-12 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <p className="label text-acc-ink">Revendeur de sneakers · neuves et occasion</p>
          <h1 className="mt-5 max-w-[14ch] font-display text-[44px] font-medium uppercase leading-[0.92] tracking-tight md:text-[84px]">
            Les paires qu&apos;on ne trouve plus en boutique.
          </h1>
          <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-muted">
            Collabs Travis Scott, Off-White ou Corteiz, Prada, Margiela : chaque paire est vérifiée par Eliott,
            notée sur 10 et expédiée sous 48 h.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/catalogue" className={buttonVariants({ size: "lg" })}>
              Voir le stock
            </Link>
            <Link href="/catalogue?tri=nouveautes" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Derniers arrivages
            </Link>
          </div>
        </div>

        <dl className="grid grid-cols-3 border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          {stats.map((s) => (
            <div key={s.label}>
              <dd className="font-mono text-4xl font-medium tabular-nums md:text-5xl">{s.value}</dd>
              <dt className="label mt-2 text-dim">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
