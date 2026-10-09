"use client";

import { Footprints, Gem, ShoppingBag, Watch, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { BrandWatermarks } from "@/components/brand/brand-watermarks";
import { ProductImage } from "@/components/product/product-image";
import { categoryHref, categoryOf, type CategoryId } from "@/data/taxonomy";
import { useCatalog } from "@/lib/catalog/provider";
import { inStock } from "@/lib/products";
import { categoryCounts } from "@/lib/shop";
import { cn } from "@/lib/utils";

import { SectionHeading } from "./section-heading";

/** visuel d'une catégorie encore vide */
const ICONS: Record<CategoryId, LucideIcon> = {
  chaussures: Footprints,
  montres: Watch,
  maroquinerie: ShoppingBag,
  accessoires: Gem,
};

/** Les quatre rayons, juste après le logo. Chaque tuile mène aux nouveautés du rayon. */
export function Categories() {
  const { products } = useCatalog();
  const cats = categoryCounts(products);

  return (
    <section id="categories" className="relative scroll-mt-20 border-b border-line bg-surface">
      <BrandWatermarks
        marks={[
          { mark: "nike", className: "-right-[30vw] -top-[2%] w-[110vw] -rotate-[8deg] opacity-[0.05] md:-right-[5vw] md:-top-[210px] md:w-[46vw]" },
        ]}
      />
      <div className="relative mx-auto max-w-[1360px] px-4 py-16 md:px-8 md:py-24">
        <SectionHeading title="Catégories" />
        <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          {cats.map((c) => {
            // la photo du dernier article arrivé dans le rayon
            const hero = products
              .filter((p) => categoryOf(p).id === c.id && inStock(p).length && p.images[0]?.src)
              .sort((a, b) => b.arrivedAt.localeCompare(a.arrivedAt))[0];
            const Icon = ICONS[c.id];
            return (
              <Link
                key={c.id}
                href={categoryHref(c.id)}
                className="group relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-md bg-tile p-4 text-tile-ink md:p-6"
              >
                {hero ? (
                  <>
                    <ProductImage
                      product={hero}
                      image={hero.images[0]}
                      className="!absolute inset-0 -translate-y-[14%] scale-[1.3] transition-transform duration-700 group-hover:scale-[1.38]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent via-45% to-white/40" />
                  </>
                ) : (
                  <Icon
                    aria-hidden
                    strokeWidth={1}
                    className="absolute left-1/2 top-[44%] size-[46%] -translate-x-1/2 -translate-y-1/2 text-tile-ink/25 transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="relative flex items-start justify-between">
                  <span className="label">
                    {c.count ? `${c.count} modèle${c.count > 1 ? "s" : ""}` : "Bientôt"}
                  </span>
                  <span className="text-xl transition-transform duration-300 group-hover:translate-x-1">→</span>
                </div>
                <h3
                  className={cn(
                    // « Maroquinerie » doit tenir dans la tuile, du téléphone au grand écran
                    "relative font-display text-[clamp(15px,4.4vw,24px)] font-semibold uppercase leading-[0.95] tracking-tight [overflow-wrap:anywhere] md:text-[clamp(28px,4.6vw,40px)] lg:text-[clamp(20px,2.25vw,36px)]",
                    hero && "drop-shadow-[0_1px_16px_rgba(255,255,255,0.7)]",
                  )}
                >
                  {c.label}
                </h3>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
