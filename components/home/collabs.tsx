"use client";

import Link from "next/link";

import { BrandWatermarks } from "@/components/brand/brand-watermarks";
import { ProductImage } from "@/components/product/product-image";
import SneakerArt from "@/components/product/sneaker-art";
import { COLLABS } from "@/data/site";
import { useCatalog } from "@/lib/catalog/provider";
import { cn } from "@/lib/utils";

import { SectionHeading } from "./section-heading";

export function Collabs() {
  const { products } = useCatalog();
  return (
    <section id="collabs" className="relative scroll-mt-20 border-y border-line bg-surface">
      {/* Travis Scott, Off-White, Corteiz, NOCTA : toutes des collabs Nike */}
      <BrandWatermarks
        marks={[
          { mark: "nike", className: "-right-[30vw] -top-[2%] w-[110vw] -rotate-[8deg] opacity-[0.05] md:-right-[5vw] md:-top-[210px] md:w-[46vw]" },
          { mark: "off-white", className: "-bottom-[190px] right-[9vw] hidden w-[15vw] -rotate-[4deg] opacity-[0.05] md:block" },
        ]}
      />
      <div className="relative mx-auto max-w-[1360px] px-4 py-20 md:px-8 md:py-28">
        <SectionHeading eyebrow="Collaborations" title={<>Les collabs<br className="md:hidden" /> du moment</>} />
        <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          {COLLABS.map((c) => {
            const items = products.filter((p) =>
              `${p.collab ?? ""} ${p.colorway}`.toLowerCase().includes(c.query),
            );
            // prefer a pair with real photos, shown as a tight crop of the main shot
            const hero = items.find((p) => p.images[0].src) ?? items[0];
            const photo = hero?.images[0].src ? hero.images[0] : undefined;
            return (
              <Link
                key={c.name}
                href={`/catalogue?q=${encodeURIComponent(c.query)}`}
                className="group relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-md bg-tile p-4 text-tile-ink md:p-6"
              >
                {photo && hero && (
                  <>
                    <ProductImage
                      product={hero}
                      image={photo}
                      className="!absolute inset-0 -translate-y-[14%] scale-[1.3] transition-transform duration-700 group-hover:scale-[1.38]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent via-45% to-white/40" />
                  </>
                )}
                <div className="relative flex items-start justify-between">
                  <span className="label">
                    {items.length} modèle{items.length > 1 ? "s" : ""}
                  </span>
                  <span className="text-xl transition-transform duration-300 group-hover:translate-x-1">→</span>
                </div>
                {!photo && hero && (
                  <SneakerArt
                    silhouette={hero.silhouette}
                    colorway={hero.colors}
                    className="w-full -rotate-6 transition-transform duration-500 group-hover:-rotate-2 group-hover:scale-105"
                  />
                )}
                <h3
                  className={cn(
                    "relative font-display text-3xl font-semibold uppercase leading-[0.9] tracking-tight md:text-5xl",
                    photo && "drop-shadow-[0_1px_16px_rgba(255,255,255,0.7)]",
                  )}
                >
                  {c.name}
                </h3>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
