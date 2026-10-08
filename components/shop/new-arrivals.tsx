"use client";

import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/data/types";
import { availability } from "@/lib/products";

/** les derniers articles arrivés (en stock), du plus récent au plus ancien */
export const latestArrivals = (products: Product[], count = 4) =>
  products
    .filter((p) => availability(p) !== "soldout")
    .sort((a, b) => b.arrivedAt.localeCompare(a.arrivedAt))
    .slice(0, count);

/** En tête d'une catégorie : ses nouveautés (rail à faire glisser sur téléphone). */
export function NewArrivals({ products }: { products: Product[] }) {
  return (
    <section aria-labelledby="nouveautes" className="border-b border-line pb-10 md:pb-14">
      <h2 id="nouveautes" className="mb-5 font-display text-3xl font-medium uppercase tracking-tight md:mb-8 md:text-4xl">
        Nouveautés
      </h2>
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:gap-x-5 md:overflow-visible md:px-0 xl:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} className="w-[72vw] shrink-0 snap-start sm:w-[44vw] md:w-auto" />
        ))}
      </div>
    </section>
  );
}
