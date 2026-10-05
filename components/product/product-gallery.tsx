"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";

import type { Product, ProductImage as ProductImageType } from "@/data/types";
import { cn } from "@/lib/utils";

import { ProductBadges } from "./condition-badge";
import { ProductImage } from "./product-image";

const VIEW_LABEL = { side: "Profil", pair: "La paire", detail: "Détail", medial: "Intérieur" };
const labelOf = (img: ProductImageType) => img.label ?? VIEW_LABEL[img.view];

export function ProductGallery({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const images = product.images;
  const go = (i: number) => setIndex((i + images.length) % images.length);

  // mobile: swipeable strip, the dots follow the scroll position
  const onScroll = () => {
    const el = strip.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div>
      {/* mobile */}
      <div className="relative -mx-4 md:hidden">
        <div
          ref={strip}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        >
          {images.map((img, i) => (
            <ProductImage
              key={i}
              product={product}
              image={img}
              className="aspect-square w-full shrink-0 snap-center"
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0">
          <ProductBadges product={product} />
        </div>
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 rounded-full transition-all",
                i === index ? "w-5 bg-tile-ink" : "w-1.5 bg-tile-ink/30",
              )}
            />
          ))}
        </div>
      </div>

      {/* tablet / desktop */}
      <div className="hidden gap-3 md:grid">
        <div className="group relative overflow-hidden rounded-md">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <ProductImage product={product} image={images[index]} className="aspect-[5/4]" />
            </motion.div>
          </AnimatePresence>
          <ProductBadges product={product} />
          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => go(index - 1)}
              aria-label="Image précédente"
              className="grid size-10 place-items-center rounded-full bg-white/80 text-tile-ink backdrop-blur hover:bg-white"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="label rounded-sm bg-white/70 px-2 py-1 text-tile-ink">
              {index + 1} / {images.length} · {labelOf(images[index])}
            </span>
            <button
              onClick={() => go(index + 1)}
              aria-label="Image suivante"
              className="grid size-10 place-items-center rounded-full bg-white/80 text-tile-ink backdrop-blur hover:bg-white"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${images.length}, minmax(0, 1fr))` }}>
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Voir : ${labelOf(img)}`}
              aria-current={i === index}
              className={cn(
                "overflow-hidden rounded-md ring-1 ring-transparent transition",
                i === index ? "ring-acc" : "hover:ring-dim",
              )}
            >
              <ProductImage product={product} image={img} className="aspect-[5/4]" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
