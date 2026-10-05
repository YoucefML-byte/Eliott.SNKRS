import { brandName } from "@/data/brands";
import { PRODUCTS } from "@/data/products";
import type { Condition, Product, SizeOption } from "@/data/types";

import { sizeValue } from "./format";

export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);

export const inStock = (p: Product) => p.sizes.filter((s) => s.stock > 0);

export const totalStock = (p: Product) => p.sizes.reduce((n, s) => n + s.stock, 0);

export type Availability = "available" | "last" | "soldout";

export function availability(p: Product): Availability {
  const n = totalStock(p);
  if (n === 0) return "soldout";
  if (n === 1) return "last";
  return "available";
}

export const conditions = (p: Product): Condition[] => [
  ...new Set(inStock(p).map((s) => s.condition)),
];

/** "Neuf", "Occasion 9/10" or "Neuf · Occasion" */
export function conditionLabel(p: Product) {
  const sizes = inStock(p).length ? inStock(p) : p.sizes;
  const kinds = new Set(sizes.map((s) => s.condition));
  if (kinds.size > 1) return "Neuf · Occasion";
  if (kinds.has("Neuf")) return "Neuf";
  const best = Math.max(...sizes.map((s) => s.grade ?? 0));
  return `Occasion ${best}/10`;
}

export const sizeLabel = (s: SizeOption) =>
  s.condition === "Neuf" ? "Neuf" : `Occasion ${s.grade}/10`;

export const fullName = (p: Product) => `${brandName(p.brand)} ${p.name}`;

export const isNew = (p: Product, now = new Date("2026-09-14")) =>
  now.getTime() - new Date(p.arrivedAt).getTime() < 8 * 24 * 3600 * 1000;

// ---------------------------------------------------------------------------
// Catalogue filtering
// ---------------------------------------------------------------------------

export type SortKey = "nouveautes" | "prix-asc" | "prix-desc";

export const SORTS: { id: SortKey; label: string }[] = [
  { id: "nouveautes", label: "Nouveautés" },
  { id: "prix-asc", label: "Prix croissant" },
  { id: "prix-desc", label: "Prix décroissant" },
];

export const PRICE_RANGES = [
  { id: "0-200", label: "Moins de 200 €", min: 0, max: 200 },
  { id: "200-500", label: "200 à 500 €", min: 200, max: 500 },
  { id: "500-1000", label: "500 à 1 000 €", min: 500, max: 1000 },
  { id: "1000+", label: "Plus de 1 000 €", min: 1000, max: Infinity },
];

export interface Filters {
  q: string;
  brands: string[];
  sizes: string[];
  condition: Condition | "";
  price: string;
  showSoldOut: boolean;
  sort: SortKey;
}

export const EMPTY_FILTERS: Filters = {
  q: "",
  brands: [],
  sizes: [],
  condition: "",
  price: "",
  showSoldOut: false,
  sort: "nouveautes",
};

export function readFilters(params: URLSearchParams): Filters {
  const list = (k: string) => params.get(k)?.split(",").filter(Boolean) ?? [];
  const cond = params.get("etat");
  const sort = params.get("tri") as SortKey | null;
  return {
    q: params.get("q") ?? "",
    brands: list("marque"),
    sizes: list("taille"),
    condition: cond === "neuf" ? "Neuf" : cond === "occasion" ? "Occasion" : "",
    price: params.get("prix") ?? "",
    showSoldOut: params.get("epuises") === "1",
    sort: SORTS.some((s) => s.id === sort) ? (sort as SortKey) : "nouveautes",
  };
}

export function writeFilters(f: Filters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.brands.length) p.set("marque", f.brands.join(","));
  if (f.sizes.length) p.set("taille", f.sizes.join(","));
  if (f.condition) p.set("etat", f.condition.toLowerCase());
  if (f.price) p.set("prix", f.price);
  if (f.showSoldOut) p.set("epuises", "1");
  if (f.sort !== "nouveautes") p.set("tri", f.sort);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const activeFilterCount = (f: Filters) =>
  f.brands.length + f.sizes.length + (f.condition ? 1 : 0) + (f.price ? 1 : 0);

const matchesQuery = (p: Product, q: string) => {
  const hay = `${fullName(p)} ${p.colorway} ${p.collab ?? ""}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
};

export function searchProducts(q: string, limit = 6) {
  if (!q.trim()) return [];
  return PRODUCTS.filter((p) => matchesQuery(p, q)).slice(0, limit);
}

export function filterProducts(f: Filters, products = PRODUCTS) {
  const range = PRICE_RANGES.find((r) => r.id === f.price);
  const out = products.filter((p) => {
    if (f.q && !matchesQuery(p, f.q)) return false;
    if (f.brands.length && !f.brands.includes(p.brand)) return false;
    if (range && (p.price < range.min || p.price >= range.max)) return false;
    // size + condition must hold on the same pair
    const pairs = p.sizes.filter(
      (s) =>
        (f.showSoldOut || s.stock > 0) &&
        (!f.sizes.length || f.sizes.includes(s.size)) &&
        (!f.condition || s.condition === f.condition),
    );
    return pairs.length > 0;
  });

  return out.sort((a, b) => {
    if (f.sort === "prix-asc") return a.price - b.price;
    if (f.sort === "prix-desc") return b.price - a.price;
    return b.arrivedAt.localeCompare(a.arrivedAt);
  });
}

/** every size present in the catalogue, sorted */
export const ALL_SIZES = [...new Set(PRODUCTS.flatMap((p) => p.sizes.map((s) => s.size)))].sort(
  (a, b) => sizeValue(a) - sizeValue(b),
);

export function related(p: Product, n = 4) {
  const others = PRODUCTS.filter((o) => o.slug !== p.slug && availability(o) !== "soldout");
  const score = (o: Product) =>
    (o.collab && o.collab === p.collab ? 3 : 0) + (o.brand === p.brand ? 2 : 0) + (o.silhouette === p.silhouette ? 1 : 0);
  return others.sort((a, b) => score(b) - score(a)).slice(0, n);
}
