"use client";

import { ChevronDown, Minus, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";

import { InstagramIcon } from "@/components/brand/instagram-icon";
import { BrandWatermarks, type BrandMarkId } from "@/components/brand/brand-watermarks";
import { ProductGrid } from "@/components/product/product-grid";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { SITE } from "@/data/site";
import { CATEGORIES, categoryOf, type FilterKey } from "@/data/taxonomy";
import type { Product } from "@/data/types";
import { useCatalog } from "@/lib/catalog/provider";
import { SORTS, type SortKey } from "@/lib/products";
import {
  activeCount,
  facet,
  filterLabel,
  inScope,
  isUseful,
  optionLabel,
  readState,
  results,
  writeState,
  type Scope,
  type ShopState,
} from "@/lib/shop";
import { cn } from "@/lib/utils";

import { Breadcrumb, type Crumb } from "./breadcrumb";
import { FilterDropdown, FilterOptions } from "./filter-controls";

export interface NavItem {
  label: string;
  href: string;
  count: number;
  active: boolean;
}

export interface ShopViewProps {
  scope: Scope;
  crumbs: Crumb[];
  eyebrow: string;
  title: string;
  /** sous-catégories (ou catégories) pour changer de rayon */
  nav?: NavItem[];
  filters: { main: FilterKey[]; more: FilterKey[] };
  /** page marque : résultats regroupés par catégorie */
  groupByCategory?: boolean;
  /** texte affiché quand le rayon n'a encore aucun article */
  emptyText?: string;
  watermark?: BrandMarkId;
  /** paramètres de l'adresse à conserver, ex. "m=nike" sur une page marque */
  baseQuery?: string;
  /** en tête de page, avant tout le stock (ex. les nouveautés d'une catégorie) ; masqué pendant une recherche ou un filtrage */
  featured?: ReactNode;
}

const plural = (n: number) => `${n} article${n > 1 ? "s" : ""}`;

export function ShopView(props: ShopViewProps) {
  const { scope, filters } = props;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const state = readState(new URLSearchParams(params.toString()));
  const { products, ready, mode } = useCatalog();
  const found = results(products, scope, state);
  const n = activeCount(state.sel);
  const [sheet, setSheet] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const update = (next: ShopState) => {
    const qs = [props.baseQuery, writeState(next)].filter(Boolean).join("&");
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const toggle = (key: FilterKey, value: string) => {
    const cur = state.sel[key] ?? [];
    const values = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    update({ ...state, sel: { ...state.sel, [key]: values } });
  };
  const clear = () => update({ ...state, sel: {} });

  // seuls les filtres qui offrent un vrai choix dans ce rayon sont proposés
  const usable = (keys: FilterKey[]) =>
    keys
      .filter((k) => !(k === "sub" && scope.sub) && !(k === "category" && scope.category))
      .map((key) => ({ key, options: facet(products, scope, state, key) }))
      .filter((f) => isUseful(f.options, state.sel[f.key]));
  const main = usable(filters.main);
  const more = usable(filters.more);
  const moreActive = more.some((f) => state.sel[f.key]?.length);
  const showMore = moreOpen || moreActive;

  const chips = [...main, ...more].flatMap((f) =>
    (state.sel[f.key] ?? []).map((v) => ({
      key: f.key,
      value: v,
      label: f.key === "size" ? `Pointure ${optionLabel(f.key, v, scope)}` : optionLabel(f.key, v, scope),
    })),
  );

  const scopeEmpty = (mode === "demo" || ready) && !products.some((p) => inScope(p, scope));
  const loading = mode === "supabase" && !ready;

  return (
    <div className="relative">
      {props.watermark && (
        <BrandWatermarks
          className="bottom-auto h-[380px] [mask-image:linear-gradient(to_bottom,black_55%,transparent)] md:h-[420px]"
          marks={[
            {
              mark: props.watermark,
              className:
                "-right-[22vw] -top-[10px] w-[78vw] rotate-[-6deg] opacity-[0.045] md:-right-[6vw] md:-top-[120px] md:w-[40vw]",
            },
          ]}
        />
      )}
      <div className="relative mx-auto max-w-[1360px] px-4 pb-24 md:px-8">
        <Breadcrumb crumbs={props.crumbs} className="pt-6 md:pt-8" />

        <div className="flex flex-col gap-6 pb-6 pt-6 md:flex-row md:items-end md:justify-between md:pt-10">
          <div>
            <p className="label text-acc-ink">{props.eyebrow}</p>
            <h1 className="mt-3 font-display text-5xl font-medium uppercase leading-none tracking-tight md:text-7xl">
              {state.q ? `« ${state.q} »` : props.title}
            </h1>
            <p className="mt-3 font-mono text-sm text-muted">{loading ? "…" : plural(found.length)}</p>
          </div>
          {!scopeEmpty && (
            <form className="relative hidden w-full max-w-sm md:block" onSubmit={(e) => e.preventDefault()} role="search">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-dim" />
              <input
                id="shop-search"
                type="search"
                value={state.q}
                onChange={(e) => update({ ...state, q: e.target.value })}
                placeholder={`Rechercher dans ${props.title.toLowerCase()}`}
                className="h-12 w-full rounded-md border border-line bg-surface pl-11 pr-4 text-[15px] outline-none placeholder:text-dim focus:border-acc"
              />
            </form>
          )}
        </div>

        {props.featured && !scopeEmpty && !state.q && n === 0 && (
          <>
            {props.featured}
            <h2 className="mb-5 mt-10 font-display text-3xl font-medium uppercase tracking-tight md:mb-6 md:mt-14 md:text-4xl">
              Tout le stock
            </h2>
          </>
        )}

        {props.nav && props.nav.length > 1 && (
          <nav aria-label="Rayons" className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
            {props.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
                  item.active ? "border-ink bg-ink text-ground" : "border-line text-muted hover:border-ink hover:text-ink",
                )}
              >
                {item.label}
                <span className={cn("font-mono text-[11px]", item.active ? "text-ground/60" : "text-dim")}>{item.count}</span>
              </Link>
            ))}
          </nav>
        )}

        {scopeEmpty ? (
          <EmptyScope text={props.emptyText} />
        ) : (
          <>
            {/* barre de filtres (ordinateur) */}
            <div className="hidden border-y border-line py-3 md:block">
              <div className="flex flex-wrap items-center gap-2">
                {main.map((f) => (
                  <FilterDropdown key={f.key} label={filterLabel(f.key, scope)} count={state.sel[f.key]?.length ?? 0}>
                    <FilterOptions fkey={f.key} options={f.options} selected={state.sel[f.key] ?? []} onToggle={(v) => toggle(f.key, v)} />
                  </FilterDropdown>
                ))}
                {more.length > 0 && !moreActive && (
                  <button
                    type="button"
                    aria-expanded={showMore}
                    onClick={() => setMoreOpen((o) => !o)}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm text-acc-ink hover:bg-acc/10"
                  >
                    {showMore ? <Minus className="size-4" /> : <Plus className="size-4" />}
                    {showMore ? "Moins de filtres" : "Plus de filtres"}
                  </button>
                )}
                <div className="ml-auto">
                  <SortSelect value={state.sort} onChange={(sort) => update({ ...state, sort })} />
                </div>
              </div>
              {showMore && more.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-line pt-3">
                  <span className="label mr-2 text-dim">Filtres avancés</span>
                  {more.map((f) => (
                    <FilterDropdown key={f.key} label={filterLabel(f.key, scope)} count={state.sel[f.key]?.length ?? 0}>
                      <FilterOptions fkey={f.key} options={f.options} selected={state.sel[f.key] ?? []} onToggle={(v) => toggle(f.key, v)} />
                    </FilterDropdown>
                  ))}
                </div>
              )}
            </div>

            {/* barre mobile */}
            <div className="sticky top-16 z-30 -mx-4 grid grid-cols-2 gap-2 border-y border-line bg-ground/95 px-4 py-2 backdrop-blur md:hidden">
              <Button variant="outline" onClick={() => setSheet(true)}>
                <SlidersHorizontal className="size-4" /> Filtres{n > 0 && <span className="text-acc-ink">({n})</span>}
              </Button>
              <SortSelect value={state.sort} onChange={(sort) => update({ ...state, sort })} />
            </div>

            <div className={cn("flex-wrap items-center gap-2 py-4", chips.length ? "flex" : "hidden")}>
              {chips.map((c) => (
                <button
                  key={c.key + c.value}
                  onClick={() => toggle(c.key, c.value)}
                  className="inline-flex items-center gap-2 rounded-full border border-line py-1.5 pl-3.5 pr-2.5 text-sm hover:border-ink"
                >
                  {c.label} <X className="size-3.5 text-muted" />
                </button>
              ))}
              <button onClick={clear} className="label ml-1 text-muted underline-offset-4 hover:text-ink hover:underline">
                Tout effacer
              </button>
            </div>

            <div className={chips.length ? "" : "pt-8"}>
              {loading ? (
                <div className="h-60 animate-pulse rounded-md bg-surface" />
              ) : found.length === 0 ? (
                <div className="rounded-md border border-dashed border-line px-6 py-20 text-center">
                  <p className="font-display text-2xl uppercase">Aucun article ne correspond</p>
                  <p className="mt-3 text-muted">Retire un filtre ou demande-nous la pièce sur Instagram.</p>
                  <Button variant="outline" className="mt-8" onClick={() => update({ q: "", sort: state.sort, sel: {} })}>
                    Tout réinitialiser
                  </Button>
                </div>
              ) : props.groupByCategory && !state.sel.category?.length ? (
                <Grouped products={found} />
              ) : (
                <ProductGrid products={found} className="lg:grid-cols-4" />
              )}
            </div>
          </>
        )}
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} side="bottom" label="Filtres">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-xl uppercase">Filtres</h2>
          <button onClick={() => setSheet(false)} aria-label="Fermer les filtres" className="grid size-10 place-items-center rounded-md hover:bg-raised">
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-2">
          {main.map((f, i) => (
            <SheetGroup key={f.key} title={filterLabel(f.key, scope)} count={state.sel[f.key]?.length ?? 0} open={i === 0}>
              <FilterOptions fkey={f.key} options={f.options} selected={state.sel[f.key] ?? []} onToggle={(v) => toggle(f.key, v)} />
            </SheetGroup>
          ))}
          {more.length > 0 &&
            (showMore ? (
              more.map((f) => (
                <SheetGroup key={f.key} title={filterLabel(f.key, scope)} count={state.sel[f.key]?.length ?? 0}>
                  <FilterOptions fkey={f.key} options={f.options} selected={state.sel[f.key] ?? []} onToggle={(v) => toggle(f.key, v)} />
                </SheetGroup>
              ))
            ) : (
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className="flex w-full items-center gap-2 py-4 text-sm text-acc-ink"
              >
                <Plus className="size-4" /> Plus de filtres
              </button>
            ))}
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-3 border-t border-line px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
          <Button variant="ghost" onClick={clear} disabled={n === 0}>
            Effacer
          </Button>
          <Button onClick={() => setSheet(false)}>Voir {plural(found.length)}</Button>
        </div>
      </Sheet>
    </div>
  );
}

function Grouped({ products }: { products: Product[] }) {
  return (
    <div className="grid gap-14">
      {CATEGORIES.map((cat) => {
        const items = products.filter((p) => categoryOf(p).id === cat.id);
        if (!items.length) return null;
        return (
          <section key={cat.id}>
            <h2 className="mb-6 flex items-baseline gap-3 font-display text-3xl font-medium uppercase tracking-tight">
              {cat.label}
              <span className="font-mono text-sm text-dim">{items.length}</span>
            </h2>
            <ProductGrid products={items} className="lg:grid-cols-4" />
          </section>
        );
      })}
    </div>
  );
}

function EmptyScope({ text }: { text?: string }) {
  return (
    <div className="mt-4 rounded-md border border-dashed border-line px-6 py-20 text-center">
      <p className="font-display text-3xl uppercase">Arrivages en préparation</p>
      <p className="mx-auto mt-3 max-w-[46ch] text-muted">
        {text ?? "Aucune pièce en ligne dans ce rayon pour le moment."} Les nouveautés sont annoncées en premier sur
        Instagram.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants()}>
          <InstagramIcon className="size-4" /> @{SITE.instagram}
        </a>
        <Link href="/catalogue" className={buttonVariants({ variant: "outline" })}>
          Voir tout le stock
        </Link>
      </div>
    </div>
  );
}

function SheetGroup({ title, count, open, children }: { title: string; count: number; open?: boolean; children: ReactNode }) {
  return (
    <details open={open || count > 0} className="group border-b border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 [&::-webkit-details-marker]:hidden">
        <span className="label text-ink">
          {title}
          {count > 0 && <span className="ml-2 text-acc-ink">({count})</span>}
        </span>
        <ChevronDown className="size-4 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-4">{children}</div>
    </details>
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
