"use client";

import Link from "next/link";

import { BrandWatermarks } from "@/components/brand/brand-watermarks";
import { brandHref } from "@/data/taxonomy";
import { useCatalog } from "@/lib/catalog/provider";
import { brandsOf } from "@/lib/products";

import { SectionHeading } from "./section-heading";

export function BrandIndex() {
  const brands = brandsOf(useCatalog().products);
  return (
    <section className="relative">
      <BrandWatermarks
        marks={[{ mark: "louis-vuitton", className: "-right-[18vw] top-[34%] w-[70vw] rotate-[-4deg] opacity-[0.04] md:-right-[7vw] md:top-[22%] md:w-[38vw]" }]}
      />
      <div className="relative mx-auto max-w-[1360px] px-4 py-20 md:px-8 md:py-28">
      <SectionHeading eyebrow="Par marque" title="Marques" href="/marques" cta="Toutes les marques" />
      <ul className="border-t border-line">
        {brands.map((b, i) => {
          const n = b.count;
          return (
            <li key={b.id} className="border-b border-line">
              <Link
                href={brandHref(b.id)}
                className="group flex items-baseline gap-4 py-5 transition-colors md:gap-8 md:py-7"
              >
                <span className="w-8 font-mono text-xs text-dim">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1 font-display text-4xl font-medium uppercase leading-none tracking-tight transition-all duration-300 group-hover:translate-x-2 group-hover:text-acc-ink md:text-7xl">
                  {b.name}
                </span>
                <span className="font-mono text-sm text-muted">
                  {n} modèle{n > 1 ? "s" : ""}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      </div>
    </section>
  );
}
