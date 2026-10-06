"use client";

import { ProductCard } from "@/components/product/product-card";
import { useCatalog } from "@/lib/catalog/provider";
import { availability } from "@/lib/products";

import { SectionHeading } from "./section-heading";

export function LatestDrops() {
  const { products } = useCatalog();
  const latest = products.filter((p) => availability(p) !== "soldout")
    .sort((a, b) => b.arrivedAt.localeCompare(a.arrivedAt))
    .slice(0, 8);

  return (
    <section className="mx-auto max-w-[1360px] px-4 py-20 md:px-8 md:py-28">
      <SectionHeading eyebrow="Arrivages de la semaine" title="Nouveautés" href="/catalogue?tri=nouveautes" cta="Tout voir" />
      {/* mobile: swipe rail, desktop: grid */}
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:gap-x-5 md:gap-y-12 md:overflow-visible md:px-0 xl:grid-cols-4">
        {latest.map((p) => (
          <ProductCard key={p.slug} product={p} className="w-[72vw] shrink-0 snap-start sm:w-[44vw] md:w-auto" />
        ))}
      </div>
    </section>
  );
}
