"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { useCatalog } from "@/lib/catalog/provider";
import { findProduct } from "@/lib/products";

import { ProductView } from "./product-view";

/** /produit/?p=<slug> — the pair is looked up in the live catalogue. */
export function ProductRoute() {
  const slug = useSearchParams().get("p") ?? "";
  const { products, ready } = useCatalog();
  const product = findProduct(products, slug);

  if (product) return <ProductView key={product.slug} product={product} />;

  if (!ready) {
    return (
      <div className="mx-auto grid max-w-[1360px] gap-10 px-4 py-10 md:grid-cols-[1.25fr_1fr] md:px-8">
        <div className="aspect-[5/4] animate-pulse rounded-md bg-surface" />
        <div className="grid content-start gap-4">
          <div className="h-4 w-24 animate-pulse rounded bg-surface" />
          <div className="h-12 w-3/4 animate-pulse rounded bg-surface" />
          <div className="h-6 w-1/2 animate-pulse rounded bg-surface" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-32 text-center">
      <h1 className="font-display text-5xl uppercase">Article introuvable</h1>
      <p className="mt-4 text-muted">Elle a peut-être déjà été vendue.</p>
      <Link href="/catalogue" className={buttonVariants({ className: "mt-8" })}>
        Voir le stock
      </Link>
    </div>
  );
}
