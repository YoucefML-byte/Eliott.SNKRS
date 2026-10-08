"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { useCatalog } from "@/lib/catalog/provider";
import { brandsOf, totalStock } from "@/lib/products";

/** Sous le logo : les chiffres du stock et l'accès au stock, sans texte. */
export function Intro() {
  const { products } = useCatalog();
  const stats = [
    { value: products.length, label: "Modèles" },
    { value: products.reduce((n, p) => n + totalStock(p), 0), label: "Pièces en stock" },
    { value: brandsOf(products).length, label: "Marques" },
  ];

  return (
    <section className="border-b border-line">
      {/* titre de la page pour les moteurs de recherche et les lecteurs d'écran */}
      <h1 className="sr-only">Eliott SNKRS — sneakers, maroquinerie et accessoires authentifiés</h1>
      <div className="mx-auto grid max-w-[1360px] gap-8 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16">
        <dl className="grid grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col">
              <dt className="label order-2 mt-2 text-dim">{s.label}</dt>
              <dd className="order-1 font-mono text-4xl font-medium tabular-nums md:text-5xl">{s.value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-3">
          <Link href="/catalogue" className={buttonVariants({ size: "lg", className: "flex-1 sm:flex-none" })}>
            Voir le stock
          </Link>
          <Link
            href="/catalogue?tri=nouveautes"
            className={buttonVariants({ size: "lg", variant: "outline", className: "flex-1 sm:flex-none" })}
          >
            Derniers arrivages
          </Link>
        </div>
      </div>
    </section>
  );
}
