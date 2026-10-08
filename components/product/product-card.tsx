"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { brandName } from "@/data/brands";
import { categoryOf, ONE_SIZE, subOf } from "@/data/taxonomy";
import type { Product } from "@/data/types";
import { useCatalog } from "@/lib/catalog/provider";
import { formatPrice, sizeValue } from "@/lib/format";
import { availability, inStock, productHref } from "@/lib/products";
import { cn } from "@/lib/utils";

import { ProductBadges } from "./condition-badge";
import { ProductImage } from "./product-image";

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const sold = availability(product) === "soldout";
  // une pointure en stock dans deux états n'est listée qu'une fois
  const sizes = [...new Set(inStock(product).map((s) => s.size))]
    .filter((s) => s !== ONE_SIZE)
    .sort((a, b) => sizeValue(a) - sizeValue(b));
  const sized = categoryOf(product).sized && sizes.length > 0;

  return (
    <div className={className}>
    <Link
      href={productHref(product.slug)}
      className={cn("group block outline-offset-4", sold && "opacity-70")}
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
        {sold ? "Vendu" : sized ? `EU ${sizes.join(" · ")}` : subOf(product).label}
      </p>
    </Link>
    <AdminDelete product={product} />
    </div>
  );
}

/** En mode admin : modifier ou supprimer l'article directement depuis sa carte. */
function AdminDelete({ product }: { product: Product }) {
  const { admin, removePair, editPair } = useCatalog();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!admin) return null;

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await removePair(product);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible.");
      setBusy(false);
    }
  };

  return (
    <div className="mt-3">
      {confirm ? (
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setConfirm(false)}
            disabled={busy}
            className="h-9 rounded-md border border-line text-xs text-muted hover:text-ink"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="h-9 rounded-md bg-destructive text-xs font-medium text-white hover:bg-destructive/90"
          >
            {busy ? "…" : "Supprimer"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => editPair(product)}
            aria-label={`Modifier ${product.name}`}
            className="flex h-9 items-center justify-center gap-1.5 rounded-md border border-line text-xs text-ink transition-colors hover:border-ink"
          >
            <Pencil className="size-3.5" /> Modifier
          </button>
          <button
            type="button"
            onClick={() => setConfirm(true)}
            aria-label={`Supprimer ${product.name}`}
            className="flex h-9 items-center justify-center gap-1.5 rounded-md border border-destructive/40 text-xs text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" /> Supprimer
          </button>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
