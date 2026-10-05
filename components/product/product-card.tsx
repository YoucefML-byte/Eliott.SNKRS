import Link from "next/link";

import { brandName } from "@/data/brands";
import type { Product } from "@/data/types";
import { formatPrice, sizeValue } from "@/lib/format";
import { availability, inStock } from "@/lib/products";
import { cn } from "@/lib/utils";

import { ProductBadges } from "./condition-badge";
import { ProductImage } from "./product-image";

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const sold = availability(product) === "soldout";
  const sizes = inStock(product)
    .map((s) => s.size)
    .sort((a, b) => sizeValue(a) - sizeValue(b));

  return (
    <Link
      href={`/produit/${product.slug}`}
      className={cn("group block outline-offset-4", sold && "opacity-70", className)}
    >
      <div className="relative overflow-hidden rounded-md">
        <ProductImage
          product={product}
          className="aspect-[4/3.4]"
          artClassName="transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:scale-[1.04]"
        />
        {/* second angle on hover (pointer devices) */}
        {product.images[1] && (
          <ProductImage
            product={product}
            image={product.images[1]}
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 [@media(hover:hover)]:group-hover:opacity-100"
          />
        )}
        <ProductBadges product={product} />
      </div>

      <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <p className="label text-muted">{brandName(product.brand)}</p>
          <h3 className="mt-1 line-clamp-2 text-[15px] font-medium leading-snug text-ink transition-colors group-hover:text-acc-ink sm:line-clamp-1">
            {product.name}
          </h3>
          <p className="truncate text-sm text-muted">{product.colorway}</p>
        </div>
        <p className="shrink-0 font-mono text-[15px] tabular-nums sm:pt-[18px]">{formatPrice(product.price)}</p>
      </div>

      <p className="mt-2 truncate font-mono text-[11px] tracking-wide text-dim">
        {sold ? "Plus de pointure disponible" : `EU ${sizes.join(" · ")}`}
      </p>
    </Link>
  );
}
