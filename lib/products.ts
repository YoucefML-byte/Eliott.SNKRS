import { brandName } from "@/data/brands";
import { categoryOf } from "@/data/taxonomy";
import type { Condition, Product, SizeOption } from "@/data/types";

import { formatPrice } from "./format";

export const findProduct = (products: Product[], slug: string) =>
  products.find((p) => p.slug === slug);

export const productHref = (slug: string) => `/produit/?p=${encodeURIComponent(slug)}`;

export const inStock = (p: Product) => p.sizes.filter((s) => s.stock > 0);

export const totalStock = (p: Product) => p.sizes.reduce((n, s) => n + s.stock, 0);

/** prix d'une ligne de stock : le sien s'il dépend de l'état, sinon celui de l'article */
export const priceOf = (p: Product, o: SizeOption) => o.price ?? p.price;

/** prix le plus bas et le plus haut des paires en stock (de toutes si tout est vendu) */
export function priceSpan(p: Product) {
  const lines = inStock(p).length ? inStock(p) : p.sizes;
  const prices = lines.length ? lines.map((o) => priceOf(p, o)) : [p.price];
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** « 290 € », ou « dès 120 € » quand le prix dépend de l'état */
export function priceText(p: Product) {
  const { min, max } = priceSpan(p);
  return min === max ? formatPrice(min) : `dès ${formatPrice(min)}`;
}

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

/**
 * État d'un exemplaire en un mot : « neuf », « occasion-9 »… Une même pointure
 * peut exister dans plusieurs états : pointure + état identifient la ligne de
 * stock (panier, commande, filtre État).
 */
export const conditionCode = (o: Pick<SizeOption, "condition" | "grade">) =>
  o.condition === "Neuf" ? "neuf" : `occasion-${o.grade ?? 0}`;

/** « Neuf », « Occasion 9/10 » (« Occasion » seul : toutes les notes) */
export const conditionCodeLabel = (code: string) =>
  code === "neuf" ? "Neuf" : code === "occasion" ? "Occasion" : `Occasion ${code.split("-")[1]}/10`;

/** neuf d'abord, puis de la meilleure à la moins bonne note */
export const conditionRank = (code: string) => (code === "neuf" ? 0 : 100 - (Number(code.split("-")[1]) || 0));

/** clé d'une ligne de stock : « 42|neuf », « 42|occasion-6 » */
export const optionKey = (o: SizeOption) => `${o.size}|${conditionCode(o)}`;

/** la ligne de stock d'une pointure dans un état (sans état, anciens paniers : la première de la pointure) */
export const findOption = (p: Product, size: string, condition?: string) =>
  p.sizes.find((o) => o.size === size && (!condition || conditionCode(o) === condition));

export const fullName = (p: Product) => `${brandName(p.brand)} ${p.name}`;

export const isNew = (p: Product, now = new Date()) =>
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

const matchesQuery = (p: Product, q: string) => {
  const hay = `${fullName(p)} ${p.colorway} ${p.collab ?? ""}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
};

export function searchProducts(products: Product[], q: string, limit = 6) {
  if (!q.trim()) return [];
  return products.filter((p) => matchesQuery(p, q)).slice(0, limit);
}

/** brands that have at least one pair, with their count */
export function brandsOf(products: Product[]) {
  const counts = new Map<string, number>();
  for (const p of products) counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1);
  return [...counts]
    .map(([id, count]) => ({ id, name: brandName(id), count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function related(products: Product[], p: Product, n = 4) {
  const others = products.filter((o) => o.slug !== p.slug && availability(o) !== "soldout");
  const score = (o: Product) =>
    (categoryOf(o).id === categoryOf(p).id ? 4 : 0) +
    (o.collab && o.collab === p.collab ? 3 : 0) +
    (o.brand === p.brand ? 2 : 0) +
    (o.model && o.model === p.model ? 1 : 0);
  return others.sort((a, b) => score(b) - score(a)).slice(0, n);
}
