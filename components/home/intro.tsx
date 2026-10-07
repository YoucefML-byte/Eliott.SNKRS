"use client";

import Link from "next/link";

import { BrandWatermarks } from "@/components/brand/brand-watermarks";
import { buttonVariants } from "@/components/ui/button";
import { useCatalog } from "@/lib/catalog/provider";
import { brandsOf, totalStock } from "@/lib/products";

export function Intro() {
  const { products } = useCatalog();
  const stats = [
    { value: products.length, label: "Modèles" },
    { value: products.reduce((n, p) => n + totalStock(p), 0), label: "Pièces en stock" },
    { value: brandsOf(products).length, label: "Marques" },
  ];

  return (
    <section className="relative border-b border-line">
      <BrandWatermarks
        marks={[{ mark: "prada", className: "-right-[28vw] -top-[4%] w-[86vw] rotate-[-5deg] opacity-[0.045] md:-right-[4vw] md:-top-[10%] md:w-[38vw]" }]}
      />
      <div className="relative mx-auto grid max-w-[1360px] gap-12 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <p className="label text-acc-ink">Sneakers · Maroquinerie · Accessoires</p>
          <h1 className="mt-5 max-w-[14ch] font-display text-[44px] font-medium uppercase leading-[0.92] tracking-tight md:text-[84px]">
            Les pièces qu&apos;on ne trouve plus en boutique.
          </h1>
          <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-muted">
            Sneakers en collab Travis Scott, Off-White ou Corteiz, maroquinerie de luxe, montres et accessoires :
            chaque pièce est authentifiée par Eliott, notée sur 10 et expédiée sous 48 h.
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
