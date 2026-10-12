"use client";

import { LogOut, Plus, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ProductImage } from "@/components/product/product-image";
import { latestArrivals } from "@/components/shop/new-arrivals";
import { Sheet } from "@/components/ui/sheet";
import { SITE } from "@/data/site";
import { useCatalog } from "@/lib/catalog/provider";
import { PRICE_RANGES, priceText, productHref } from "@/lib/products";
import { SIZE_RANGES } from "@/lib/shop";
import { cn } from "@/lib/utils";

import { navMenus } from "./nav-menus";

type Entry = { label: string; href: string; external?: boolean; links?: { label: string; href: string }[] };

/** Menu téléphone : de grands intitulés, un « + » pour déplier, les dernières arrivées en bas. */
export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { products, admin, setFormOpen, signOut } = useCatalog();
  const [unfolded, setUnfolded] = useState<string | null>(null);
  const menus = navMenus(products);
  const cheap = PRICE_RANGES[0];

  const entries: Entry[] = [
    { label: "Accueil", href: "/" },
    { label: "Tout le stock", href: "/catalogue" },
    ...menus.filter((m) => m.id !== "marques"),
    {
      label: "Trier par taille",
      href: "/chaussures",
      links: SIZE_RANGES.map((r) => ({ label: r.label, href: `/chaussures/?taille=${r.id}` })),
    },
    { label: cheap.label, href: `/catalogue/?prix=${cheap.id}` },
    ...menus.filter((m) => m.id === "marques"),
    { label: "Contact", href: SITE.instagramDm, external: true },
  ];
  const arrivals = latestArrivals(products, 8);

  const close = () => {
    setUnfolded(null);
    onClose();
  };

  return (
    <Sheet open={open} onClose={close} side="left" label="Menu" className="w-[calc(100%-2.5rem)] max-w-[440px]">
      <div className="px-3 pt-3">
        <button onClick={close} aria-label="Fermer le menu" className="grid size-11 place-items-center rounded-md hover:bg-raised">
          <X className="size-6" strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+20px)]">
        <nav aria-label="Navigation principale" className="px-6 pt-4">
          <ul className="grid gap-1">
            {entries.map((e) => {
              const folded = unfolded !== e.label;
              const links = e.links ?? [];
              const label = "py-1.5 text-[32px] leading-tight tracking-tight active:text-acc-ink";
              return (
                <li key={e.label}>
                  <div className="flex items-center justify-between gap-3">
                    {e.external ? (
                      <a href={e.href} target="_blank" rel="noopener noreferrer" onClick={close} className={label}>
                        {e.label}
                      </a>
                    ) : (
                      <Link href={e.href} onClick={close} className={label}>
                        {e.label}
                      </Link>
                    )}
                    {links.length > 0 && (
                      <button
                        onClick={() => setUnfolded(folded ? e.label : null)}
                        aria-expanded={!folded}
                        aria-label={`${folded ? "Déplier" : "Replier"} ${e.label}`}
                        className="grid size-11 shrink-0 place-items-center rounded-md hover:bg-raised"
                      >
                        <Plus className={cn("size-5 transition-transform duration-200", !folded && "rotate-45")} strokeWidth={1.75} />
                      </button>
                    )}
                  </div>
                  {!folded && (
                    <ul className="grid gap-0.5 pb-3 pl-1 pt-1">
                      {links.map((l) => (
                        <li key={l.href}>
                          <Link href={l.href} onClick={close} className="block py-1.5 text-lg text-muted active:text-ink">
                            {l.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {admin && (
          <div className="mx-6 mt-8 grid gap-2 border-t border-line pt-5">
            <p className="label text-acc-ink">Mode admin · {admin.email}</p>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <button
                onClick={() => {
                  close();
                  setFormOpen(true);
                }}
                className="flex flex-col items-center gap-1 rounded-md bg-acc px-2 py-3 text-on-acc"
              >
                <Plus className="size-5" /> Ajouter
              </button>
              <Link href="/admin" onClick={close} className="flex flex-col items-center gap-1 rounded-md border border-line px-2 py-3">
                <ShieldCheck className="size-5" /> Espace admin
              </Link>
              <button
                onClick={() => {
                  close();
                  signOut();
                }}
                className="flex flex-col items-center gap-1 rounded-md border border-line px-2 py-3"
              >
                <LogOut className="size-5" /> Déconnexion
              </button>
            </div>
          </div>
        )}

        {arrivals.length > 0 && (
          <section aria-label="Dernières arrivées" className="mt-10">
            <ul className="no-scrollbar flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto px-6">
              {arrivals.map((p) => (
                <li key={p.slug} className="w-[42%] shrink-0 snap-start">
                  <Link href={productHref(p.slug)} onClick={close} className="block">
                    <ProductImage product={p} className="aspect-square rounded-md" />
                    <p className="mt-3 line-clamp-2 text-[15px] font-bold leading-snug">{p.name}</p>
                    <p className="mt-0.5 text-[15px] tabular-nums">{priceText(p)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <ul className="mt-10 flex flex-wrap gap-x-5 gap-y-1 px-6 text-xs text-muted">
          <li>
            <Link href="/mentions-legales" onClick={close}>Mentions légales</Link>
          </li>
          <li>
            <Link href="/confidentialite" onClick={close}>Confidentialité</Link>
          </li>
          <li>
            <Link href="/cgv" onClick={close}>CGV</Link>
          </li>
          <li>
            <a href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer">Instagram @{SITE.instagram}</a>
          </li>
        </ul>
      </div>
    </Sheet>
  );
}
