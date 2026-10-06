"use client";

import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { ProductGrid } from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { brandName } from "@/data/brands";
import { useCatalog } from "@/lib/catalog/provider";
import {
  activeFilterCount,
  EMPTY_FILTERS,
  filterProducts,
  PRICE_RANGES,
  readFilters,
  SORTS,
  writeFilters,
  type Filters,
  type SortKey,
} from "@/lib/products";

import { FilterPanel } from "./filter-panel";

export function CatalogueView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const filters = readFilters(new URLSearchParams(params.toString()));
  const { products } = useCatalog();
  const results = filterProducts(filters, products);
  const [sheet, setSheet] = useState(false);

  const update = (f: Filters) => router.replace(pathname + writeFilters(f), { scroll: false });
  const clear = () => update({ ...EMPTY_FILTERS, q: filters.q, sort: filters.sort });
  const n = activeFilterCount(filters);

  const chips: { label: string; remove: Partial<Filters> }[] = [
    ...filters.brands.map((b) => ({ label: brandName(b), remove: { brands: filters.brands.filter((x) => x !== b) } })),
    ...filters.sizes.map((s) => ({ label: `EU ${s}`, remove: { sizes: filters.sizes.filter((x) => x !== s) } })),
    ...(filters.condition ? [{ label: filters.condition, remove: { condition: "" as const } }] : []),
    ...(filters.price
      ? [{ label: PRICE_RANGES.find((r) => r.id === filters.price)?.label ?? "", remove: { price: "" } }]
      : []),
  ];

  const title = filters.q ? `« ${filters.q} »` : filters.brands.length === 1 ? brandName(filters.brands[0]) : "Le stock";

  return (
    <div className="mx-auto max-w-[1360px] px-4 pb-24 md:px-8">
      <div className="flex flex-col gap-6 pb-8 pt-10 md:flex-row md:items-end md:justify-between md:pt-16">
        <div>
          <p className="label text-acc-ink">Sneakers · neuves et occasion</p>
          <h1 className="mt-3 font-display text-5xl font-medium uppercase leading-none tracking-tight md:text-7xl">
            {title}
          </h1>
          <p className="mt-3 font-mono text-sm text-muted">
            {results.length} modèle{results.length > 1 ? "s" : ""}
          </p>
        </div>

        <form
          className="relative hidden w-full max-w-sm md:block"
          onSubmit={(e) => e.preventDefault()}
          role="search"
        >
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-dim" />
          <input
            id="catalogue-search"
            type="search"
            value={filters.q}
            onChange={(e) => update({ ...filters, q: e.target.value })}
            placeholder="Rechercher dans le stock"
            className="h-12 w-full rounded-md border border-line bg-surface pl-11 pr-4 text-[15px] outline-none placeholder:text-dim focus:border-acc"
          />
        </form>
      </div>

      {/* mobile toolbar */}
      <div className="sticky top-16 z-30 -mx-4 mb-6 grid grid-cols-2 gap-2 border-y border-line bg-ground/95 px-4 py-2 backdrop-blur md:hidden">
        <Button variant="outline" onClick={() => setSheet(true)}>
          <SlidersHorizontal className="size-4" /> Filtres{n > 0 && <span className="text-acc-ink">({n})</span>}
        </Button>
        <SortSelect value={filters.sort} onChange={(sort) => update({ ...filters, sort })} />
      </div>

      <div className="grid gap-10 md:grid-cols-[220px_1fr] lg:grid-cols-[250px_1fr] lg:gap-14">
        <aside className="hidden md:block">
          <div className="sticky top-24">
            <FilterPanel filters={filters} onChange={update} />
            {n > 0 && (
              <button onClick={clear} className="label mt-8 text-muted underline-offset-4 hover:text-ink hover:underline">
                Effacer les filtres
              </button>
            )}
          </div>
        </aside>

        <div>
          <div className={`mb-6 min-h-10 flex-wrap items-center gap-2 ${chips.length ? "flex" : "hidden md:flex"}`}>
            {chips.map((c) => (
              <button
                key={c.label}
                onClick={() => update({ ...filters, ...c.remove })}
                className="inline-flex items-center gap-2 rounded-full border border-line py-1.5 pl-3.5 pr-2.5 text-sm hover:border-ink"
              >
                {c.label} <X className="size-3.5 text-muted" />
              </button>
            ))}
            <div className="ml-auto hidden md:block">
              <SortSelect value={filters.sort} onChange={(sort) => update({ ...filters, sort })} />
            </div>
          </div>

          {results.length > 0 ? (
            <ProductGrid products={results} className="xl:grid-cols-3" />
          ) : (
            <div className="rounded-md border border-dashed border-line px-6 py-20 text-center">
              <p className="font-display text-2xl uppercase">Aucune paire ne correspond</p>
              <p className="mt-3 text-muted">Retire un filtre ou demande-nous la paire sur Instagram.</p>
              <Button variant="outline" className="mt-8" onClick={() => update(EMPTY_FILTERS)}>
                Tout réinitialiser
              </Button>
            </div>
          )}
        </div>
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} side="bottom" label="Filtres">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-xl uppercase">Filtres</h2>
          <button onClick={() => setSheet(false)} aria-label="Fermer les filtres" className="grid size-10 place-items-center rounded-md hover:bg-raised">
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-6">
          <FilterPanel filters={filters} onChange={update} />
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-3 border-t border-line px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
          <Button variant="ghost" onClick={clear} disabled={n === 0}>
            Effacer
          </Button>
          <Button onClick={() => setSheet(false)}>
            Voir {results.length} modèle{results.length > 1 ? "s" : ""}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function SortSelect({ value, onChange }: { value: SortKey; onChange: (s: SortKey) => void }) {
  return (
    <label className="relative block">
      <span className="sr-only">Trier par</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="h-12 w-full cursor-pointer appearance-none rounded-md border border-line bg-ground pl-4 pr-10 font-mono text-xs uppercase tracking-[0.12em] text-ink outline-none hover:border-ink focus:border-acc md:h-10 md:w-auto"
      >
        {SORTS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </label>
  );
}
