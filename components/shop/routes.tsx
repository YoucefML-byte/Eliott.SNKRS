"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { BrandMark, hasMark } from "@/components/brand/brand-watermarks";
import { brandName } from "@/data/brands";
import {
  ALL_FILTERS,
  BRAND_FILTERS,
  brandHref,
  categoryById,
  categoryHref,
  categoryOf,
  subHref,
  type CategoryId,
} from "@/data/taxonomy";
import { useCatalog } from "@/lib/catalog/provider";
import { brandsOf } from "@/lib/products";
import { categoryCounts, subCounts } from "@/lib/shop";

import { Breadcrumb } from "./breadcrumb";
import { ShopView } from "./shop-view";

/** /catalogue — tout le stock, toutes catégories */
export function CatalogueRoute() {
  const { products } = useCatalog();
  const cats = categoryCounts(products).filter((c) => c.count > 0);
  return (
    <ShopView
      scope={{}}
      crumbs={[{ label: "Tout le stock" }]}
      eyebrow="Chaussures · Montres · Maroquinerie · Accessoires"
      title="Tout le stock"
      nav={[
        { label: "Tout", href: "/catalogue", count: cats.reduce((n, c) => n + c.count, 0), active: true },
        ...cats.map((c) => ({ label: c.label, href: categoryHref(c.id), count: c.count, active: false })),
      ]}
      filters={ALL_FILTERS}
      watermark="nike"
    />
  );
}

const EMPTY_TEXT: Record<CategoryId, string> = {
  chaussures: "Aucune paire en ligne dans ce rayon pour le moment.",
  montres: "Aucune montre en ligne pour le moment.",
  maroquinerie: "Aucune pièce de maroquinerie en ligne pour le moment.",
  accessoires: "Aucun accessoire en ligne pour le moment.",
};

/** /chaussures et /chaussures/sneakers */
export function CategoryRoute({ category, sub }: { category: CategoryId; sub?: string }) {
  const { products } = useCatalog();
  const cat = categoryById(category)!;
  const subs = subCounts(products, category);
  const current = sub ? cat.subs.find((s) => s.id === sub) : undefined;
  if (current && !subs.some((s) => s.id === current.id)) subs.push({ ...current, count: 0 });

  return (
    <ShopView
      key={category + (sub ?? "")}
      scope={{ category, sub }}
      crumbs={current ? [{ label: cat.label, href: categoryHref(category) }, { label: current.label }] : [{ label: cat.label }]}
      eyebrow={current ? cat.label : "Neuf et occasion · authentifié"}
      title={current?.label ?? cat.label}
      nav={[
        { label: "Tout", href: categoryHref(category), count: subs.reduce((n, s) => n + s.count, 0), active: !current },
        ...subs.map((s) => ({ label: s.label, href: subHref(category, s.id), count: s.count, active: s.id === sub })),
      ]}
      filters={cat.filters}
      emptyText={EMPTY_TEXT[category]}
      watermark={category === "chaussures" ? "nike" : undefined}
    />
  );
}

/** /marques et /marques/?m=nike */
export function BrandRoute() {
  const brand = useSearchParams().get("m");
  return brand ? <BrandPage brand={brand} /> : <BrandsIndex />;
}

function BrandPage({ brand }: { brand: string }) {
  const { products } = useCatalog();
  const cats = categoryCounts(products, { brand }).filter((c) => c.count > 0);
  return (
    <ShopView
      key={brand}
      scope={{ brand }}
      baseQuery={`m=${encodeURIComponent(brand)}`}
      crumbs={[{ label: "Marques", href: "/marques" }, { label: brandName(brand) }]}
      eyebrow={cats.length ? cats.map((c) => c.label).join(" · ") : "Marque"}
      title={brandName(brand)}
      filters={BRAND_FILTERS}
      groupByCategory
      emptyText={`Aucune pièce ${brandName(brand)} en ligne pour le moment.`}
      watermark={hasMark(brand) ? brand : undefined}
    />
  );
}

function BrandsIndex() {
  const { products, ready, mode } = useCatalog();
  const available = products.filter((p) => p.sizes.some((o) => o.stock > 0));
  const brands = brandsOf(available);
  return (
    <div className="mx-auto max-w-[1360px] px-4 pb-24 md:px-8">
      <Breadcrumb crumbs={[{ label: "Marques" }]} className="pt-6 md:pt-8" />
      <div className="pb-10 pt-6 md:pt-10">
        <p className="label text-acc-ink">Toutes les maisons en stock</p>
        <h1 className="mt-3 font-display text-5xl font-medium uppercase leading-none tracking-tight md:text-7xl">Marques</h1>
        <p className="mt-3 font-mono text-sm text-muted">
          {mode === "supabase" && !ready ? "…" : `${brands.length} marque${brands.length > 1 ? "s" : ""}`}
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
        {brands.map((b) => {
          const cats = [...new Set(available.filter((p) => p.brand === b.id).map((p) => categoryOf(p).label))];
          return (
            <li key={b.id}>
              <Link
                href={brandHref(b.id)}
                className="group flex aspect-[4/3] flex-col justify-between rounded-md border border-line bg-surface p-4 transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-ground md:p-6"
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim transition-colors group-hover:text-ground/60">
                  {b.count} article{b.count > 1 ? "s" : ""}
                </span>
                <span className="flex flex-1 items-center justify-center py-3">
                  {hasMark(b.id) ? (
                    <BrandMark mark={b.id} className="max-h-[72px] w-auto max-w-[70%] md:max-h-[96px]" />
                  ) : (
                    <span className="text-center font-display text-3xl font-medium uppercase leading-none tracking-tight md:text-4xl">
                      {b.name}
                    </span>
                  )}
                </span>
                <span className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{b.name}</span>
                  <span className="truncate text-xs text-muted transition-colors group-hover:text-ground/60">{cats.join(" · ")}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
