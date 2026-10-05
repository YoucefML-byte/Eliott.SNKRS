"use client";

import { ArrowRight, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ProductImage } from "@/components/product/product-image";
import { Sheet } from "@/components/ui/sheet";
import { brandName } from "@/data/brands";
import { formatPrice } from "@/lib/format";
import { searchProducts } from "@/lib/products";

const SUGGESTIONS = ["Travis Scott", "Dunk SB", "Jordan 4", "2002R", "Off-White", "Samba"];

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const results = searchProducts(q);

  useEffect(() => {
    if (open) window.setTimeout(() => input.current?.focus(), 80);
  }, [open]);

  const close = () => {
    setQ("");
    onClose();
  };

  const submit = (term: string) => {
    close();
    router.push(`/catalogue?q=${encodeURIComponent(term.trim())}`);
  };

  return (
    <Sheet open={open} onClose={close} side="top" label="Rechercher" className="max-h-[100dvh] overflow-y-auto">
      <div className="mx-auto w-full max-w-[1100px] px-4 pb-8 pt-4 md:px-8 md:pb-12 md:pt-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) submit(q);
          }}
          className="flex items-center gap-3 border-b border-line pb-3"
        >
          <Search className="size-5 shrink-0 text-muted" />
          <input
            ref={input}
            id="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Modèle, collab, coloris…"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent font-display text-2xl uppercase tracking-tight outline-none placeholder:text-dim md:text-4xl"
          />
          <button type="button" onClick={close} aria-label="Fermer la recherche" className="grid size-10 place-items-center rounded-md hover:bg-raised">
            <X className="size-5" />
          </button>
        </form>

        {q.trim() === "" ? (
          <div className="mt-6">
            <p className="label text-dim">Recherches fréquentes</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setQ(s)}
                  className="rounded-full border border-line px-4 py-2 text-sm hover:border-acc hover:text-acc"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          <p className="mt-8 text-muted">Aucune paire ne correspond à « {q} ». Essaie un autre modèle.</p>
        ) : (
          <>
            <ul className="mt-6 grid gap-x-6 gap-y-2 md:grid-cols-2">
              {results.map((p) => (
                <li key={p.slug}>
                  <Link href={`/produit/${p.slug}`} onClick={close} className="group flex items-center gap-4 rounded-md p-2 hover:bg-raised">
                    <ProductImage product={p} className="size-16 shrink-0 rounded-sm" artClassName="w-[95%]" />
                    <div className="min-w-0 flex-1">
                      <p className="label text-muted">{brandName(p.brand)}</p>
                      <p className="truncate group-hover:text-acc">{p.name} · {p.colorway}</p>
                    </div>
                    <span className="font-mono text-sm tabular-nums">{formatPrice(p.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <button onClick={() => submit(q)} className="label mt-6 inline-flex items-center gap-2 text-acc hover:underline">
              Voir tous les résultats <ArrowRight className="size-3.5" />
            </button>
          </>
        )}
      </div>
    </Sheet>
  );
}
