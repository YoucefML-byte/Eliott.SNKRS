import Link from "next/link";

import SneakerArt from "@/components/product/sneaker-art";
import { PRODUCTS } from "@/data/products";
import { COLLABS } from "@/data/site";

import { SectionHeading } from "./section-heading";

export function Collabs() {
  return (
    <section id="collabs" className="scroll-mt-20 border-y border-line bg-surface">
      <div className="mx-auto max-w-[1360px] px-4 py-20 md:px-8 md:py-28">
        <SectionHeading eyebrow="Collaborations" title={<>Les collabs<br className="md:hidden" /> du moment</>} />
        <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          {COLLABS.map((c) => {
            const items = PRODUCTS.filter((p) => p.collab?.toLowerCase().includes(c.query));
            const hero = items[0];
            return (
              <Link
                key={c.name}
                href={`/catalogue?q=${encodeURIComponent(c.query)}`}
                className="group relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-md bg-tile p-4 text-tile-ink md:p-6"
              >
                <div className="flex items-start justify-between">
                  <span className="label">{items.length} modèle{items.length > 1 ? "s" : ""}</span>
                  <span className="text-xl transition-transform duration-300 group-hover:translate-x-1">→</span>
                </div>
                {hero && (
                  <SneakerArt
                    silhouette={hero.silhouette}
                    colorway={hero.colors}
                    className="w-full -rotate-6 transition-transform duration-500 group-hover:-rotate-2 group-hover:scale-105"
                  />
                )}
                <h3 className="font-display text-3xl font-semibold uppercase leading-[0.9] tracking-tight md:text-5xl">
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
