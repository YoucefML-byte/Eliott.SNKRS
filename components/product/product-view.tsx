"use client";

import { Check, ChevronDown, MessageCircle, PackageCheck, ShieldCheck, Trash2, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { brandName } from "@/data/brands";
import { SITE } from "@/data/site";
import type { Product } from "@/data/types";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { useCatalog } from "@/lib/catalog/provider";
import { availability, inStock, related, sizeLabel } from "@/lib/products";
import { cn } from "@/lib/utils";

import { Price } from "./price";
import { ProductGallery } from "./product-gallery";
import { ProductGrid } from "./product-grid";
import { SizeSelector } from "./size-selector";

export function ProductView({ product }: { product: Product }) {
  const cart = useCart();
  const catalog = useCatalog();
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
      {catalog.admin && <AdminBar product={product} />}

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
          <p className="label text-acc-ink">
            {brandName(product.brand)}
            {product.collab && <span className="text-muted"> × {product.collab}</span>}
          </p>
          <h1 className="mt-3 font-display text-[40px] font-medium uppercase leading-[0.95] tracking-tight md:text-[52px]">
            {product.name}
          </h1>
          <p className="mt-3 text-lg text-muted">{product.colorway}</p>

          <div className="mt-6 flex items-end justify-between border-y border-line py-4">
            <Price value={product.price} className="text-[28px] leading-none" />
            <span className="label text-right leading-relaxed text-dim">
              {product.retail != null && <>Prix de sortie {formatPrice(product.retail)}<br /></>}
              {product.releaseYear != null && <>Sortie {product.releaseYear}</>}
            </span>
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
            <Button size="lg" variant={size && !sold ? "primary" : "outline"} onClick={add} disabled={!size || sold}>
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
              <ShieldCheck className="size-5 shrink-0 text-acc-ink" />
              Authentifiée par Eliott avant l&apos;envoi, photos de la paire sur demande.
            </li>
            <li className="flex gap-3">
              <Truck className="size-5 shrink-0 text-acc-ink" />
              Expédiée sous 48 h, livraison offerte dès {formatPrice(SITE.freeShippingFrom)}.
            </li>
            <li className="flex gap-3">
              <PackageCheck className="size-5 shrink-0 text-acc-ink" />
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
              Envoi suivi en 48 h ouvrées. Tu disposes de 14 jours après réception pour changer d&apos;avis, sur
              toutes les paires, neuves comme d&apos;occasion (voir les <Link href="/cgv" className="underline underline-offset-4">CGV</Link>).
            </Details>
          </div>
        </div>
      </div>

      <section className="mt-24 md:mt-32">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-3xl font-medium uppercase tracking-tight md:text-4xl">
            Dans le même esprit
          </h2>
          <Link href="/catalogue" className="label text-muted hover:text-acc-ink">
            Tout le stock →
          </Link>
        </div>
        <ProductGrid products={related(catalog.products, product)} className="xl:grid-cols-4" />
      </section>

      {/* mobile: sticky add-to-cart */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ground/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{size ? `EU ${size}` : "Pointure ?"}</p>
            <p className="font-mono text-sm tabular-nums text-muted">{formatPrice(product.price)}</p>
          </div>
          <Button
            variant={size && !sold ? "primary" : "outline"}
            onClick={add}
            disabled={!size || sold}
            className="h-12 flex-[2]"
          >
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

/** Shown to the logged-in admin only: take the pair off the site. */
function AdminBar({ product }: { product: Product }) {
  const { removePair } = useCatalog();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setBusy(true);
    try {
      await removePair(product);
      router.push("/catalogue");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible.");
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-warm/50 bg-warm/10 px-4 py-3 text-sm">
      <span className="flex items-center gap-2">
        <ShieldCheck className="size-4" /> Mode admin
      </span>
      {error && <span className="text-destructive">{error}</span>}
      {confirm ? (
        <span className="flex items-center gap-2">
          Retirer cette paire du site ?
          <Button size="sm" variant="outline" onClick={() => setConfirm(false)} disabled={busy}>
            Annuler
          </Button>
          <Button size="sm" onClick={remove} disabled={busy} className="bg-destructive text-white hover:bg-destructive/90">
            {busy ? "Suppression…" : "Supprimer"}
          </Button>
        </span>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setConfirm(true)}>
          <Trash2 className="size-4" /> Supprimer la paire
        </Button>
      )}
    </div>
  );
}
