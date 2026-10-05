import Link from "next/link";

import { BRANDS } from "@/data/brands";
import { PRODUCTS } from "@/data/products";

import { SectionHeading } from "./section-heading";

export function BrandIndex() {
  return (
    <section className="mx-auto max-w-[1360px] px-4 py-20 md:px-8 md:py-28">
      <SectionHeading eyebrow="Par marque" title="Marques" href="/catalogue" cta="Tout le stock" />
      <ul className="border-t border-line">
        {BRANDS.map((b, i) => {
          const n = PRODUCTS.filter((p) => p.brand === b.id).length;
          return (
            <li key={b.id} className="border-b border-line">
              <Link
                href={`/catalogue?marque=${b.id}`}
                className="group flex items-baseline gap-4 py-5 transition-colors md:gap-8 md:py-7"
              >
                <span className="w-8 font-mono text-xs text-dim">0{i + 1}</span>
                <span className="flex-1 font-display text-4xl font-medium uppercase leading-none tracking-tight transition-all duration-300 group-hover:translate-x-2 group-hover:text-acc md:text-7xl">
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
    </section>
  );
}
