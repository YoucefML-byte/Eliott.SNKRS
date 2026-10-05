"use client";

import { Check, ChevronDown, MessageCircle, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { brandName } from "@/data/brands";
import { SITE } from "@/data/site";
import type { Product } from "@/data/types";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { availability, inStock, related, sizeLabel } from "@/lib/products";
import { cn } from "@/lib/utils";

import { Price } from "./price";
import { ProductGallery } from "./product-gallery";
import { ProductGrid } from "./product-grid";
import { SizeSelector } from "./size-selector";

export function ProductView({ product }: { product: Product }) {
  const cart = useCart();
  const available = inStock(product);
  // a single pair left is pre-selected
  const [size, setSize] = useState<string | null>(available.length === 1 ? available[0].size : null);
  const [added, setAdded] = useState(false);
  const sold = availability(product) === "soldout";
  const option = product.sizes.find((s) => s.size === size);

  const add = () => {
    if (!size) return;
    cart.add(product.slug, size);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const cta = sold ? "Épuisé" : !size ? "Choisir une pointure" : added ? "Ajouté" : "Ajouter au panier";

  return (
    <div className="mx-auto max-w-[1360px] px-4 md:px-8">
      <nav aria-label="Fil d'Ariane" className="label hidden py-6 text-dim md:block">
        <Link href="/" className="hover:text-ink">Accueil</Link>
        <span className="mx-2">/</span>
        <Link href="/catalogue" className="hover:text-ink">Sneakers</Link>
        <span className="mx-2">/</span>
        <Link href={`/catalogue?marque=${product.brand}`} className="hover:text-ink">
          {brandName(product.brand)}
        </Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-[1.25fr_1fr] md:gap-12 lg:gap-16">
        <ProductGallery product={product} />

        <div className="md:sticky md:top-24 md:self-start">
          <p className="label text-acc">{product.collab ?? brandName(product.brand)}</p>
          <h1 className="mt-3 font-display text-[40px] font-medium uppercase leading-[0.95] tracking-tight md:text-[52px]">
            {brandName(product.brand)} {product.name}
          </h1>
          <p className="mt-3 text-lg text-muted">{product.colorway}</p>

          <div className="mt-6 flex items-baseline justify-between border-y border-line py-4">
            <Price value={product.price} retail={product.retail} className="text-2xl" />
            <span className="label text-dim">Sortie {product.releaseYear}</span>
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="label text-ink">Pointure EU</h2>
              <span className="label text-muted">
                {available.length} pointure{available.length > 1 ? "s" : ""} en stock
              </span>
            </div>
            <SizeSelector sizes={product.sizes} value={size} onChange={setSize} />
            <p className="mt-3 min-h-5 text-sm text-muted" aria-live="polite">
              {option &&
                `${sizeLabel(option)} · ${option.stock > 1 ? `${option.stock} paires` : "dernière paire"} dans cette pointure`}
            </p>
          </div>

          <div className="mt-6 hidden gap-3 md:grid">
            <Button size="lg" onClick={add} disabled={!size || sold}>
              {added && <Check className="size-4" />}
              {cta}
            </Button>
            <a
              href={SITE.instagramDm}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              <MessageCircle className="size-4" />
              Une question ? Instagram
            </a>
          </div>

          <ul className="mt-8 grid gap-3 text-sm text-muted">
            <li className="flex gap-3">
              <ShieldCheck className="size-5 shrink-0 text-acc" />
              Authentifiée par Eliott avant l&apos;envoi, photos de la paire sur demande.
            </li>
            <li className="flex gap-3">
              <Truck className="size-5 shrink-0 text-acc" />
              Expédiée sous 48 h, livraison offerte dès {formatPrice(SITE.freeShippingFrom)}.
            </li>
            <li className="flex gap-3">
              <PackageCheck className="size-5 shrink-0 text-acc" />
              Double boîte et emballage protégé.
            </li>
          </ul>

          <div className="mt-8 divide-y divide-line border-y border-line">
            <Details title="Description" open>
              {product.description}
            </Details>
            <Details title="État de la paire">
              {product.sizes.map((s) => (
                <span key={s.size} className="block">
                  EU {s.size} — {sizeLabel(s)}
                  {s.condition === "Occasion" && " · nettoyée, défauts éventuels photographiés"}
                </span>
              ))}
            </Details>
            <Details title="Livraison et retours">
              Envoi suivi en 48 h ouvrées. Les paires neuves peuvent être retournées sous 14 jours,
              non portées et dans leur boîte d&apos;origine.
            </Details>
          </div>
        </div>
      </div>

      <section className="mt-24 md:mt-32">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-3xl font-medium uppercase tracking-tight md:text-4xl">
            Dans le même esprit
          </h2>
          <Link href="/catalogue" className="label text-muted hover:text-acc">
            Tout le stock →
          </Link>
        </div>
        <ProductGrid products={related(product)} className="xl:grid-cols-4" />
      </section>

      {/* mobile: sticky add-to-cart */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ground/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{size ? `EU ${size}` : "Pointure ?"}</p>
            <p className="font-mono text-sm tabular-nums text-muted">{formatPrice(product.price)}</p>
          </div>
          <Button onClick={add} disabled={!size || sold} className="h-12 flex-[2]">
            {added && <Check className="size-4" />}
            {cta}
          </Button>
        </div>
      </div>
      <div className="h-24 md:hidden" />
    </div>
  );
}

function Details({ title, open, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className={cn("size-4 text-muted transition-transform group-open:rotate-180")} />
      </summary>
      <div className="mt-3 text-sm leading-relaxed text-muted">{children}</div>
    </details>
  );
}
