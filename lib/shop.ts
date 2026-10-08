// Moteur du catalogue : périmètre de la page (catégorie, sous-catégorie ou
// marque), filtres lus dans l'adresse, comptage des résultats par option.

import { brandName } from "@/data/brands";
import {
  CATEGORIES,
  categoryById,
  categoryOf,
  COLORS,
  ONE_SIZE,
  subOf,
  type CategoryId,
  type FilterKey,
} from "@/data/taxonomy";
import type { Product, SizeOption } from "@/data/types";

import { sizeValue } from "./format";
import {
  conditionCode,
  conditionCodeLabel,
  conditionRank,
  fullName,
  priceOf,
  priceSpan,
  PRICE_RANGES,
  SORTS,
  type SortKey,
} from "./products";

export interface Scope {
  category?: CategoryId;
  sub?: string;
  brand?: string;
}

export type Selection = Partial<Record<FilterKey, string[]>>;

export interface ShopState {
  q: string;
  sort: SortKey;
  sel: Selection;
}

interface FilterDef {
  label: string;
  /** nom dans l'adresse de la page */
  param: string;
  /** valeurs portées par l'article */
  values?: (p: Product) => (string | undefined)[];
  /** valeurs portées par chaque exemplaire (pointure, état, prix, disponibilité) */
  option?: (o: SizeOption, p: Product) => string | undefined;
  optionLabel?: (v: string, scope: Scope) => string;
  order?: (v: string, scope: Scope) => number;
}

const priceRange = (price: number) => PRICE_RANGES.find((r) => price >= r.min && price < r.max)?.id;

/** tranches du filtre Pointure (EU, demi-pointures comprises) */
export const SIZE_RANGES = [
  { id: "35-38", label: "35 à 37,5", min: 0, max: 38 },
  { id: "38-40", label: "38 à 39,5", min: 38, max: 40 },
  { id: "40-42", label: "40 à 41,5", min: 40, max: 42 },
  { id: "42-44", label: "42 à 43,5", min: 42, max: 44 },
  { id: "44-plus", label: "44 et plus", min: 44, max: Infinity },
];
const sizeRange = (size: string) => {
  const v = sizeValue(size);
  return SIZE_RANGES.find((r) => v >= r.min && v < r.max)?.id;
};
const indexIn = (list: string[]) => (v: string) => {
  const i = list.indexOf(v);
  return i < 0 ? list.length : i;
};

export const FILTERS: Record<FilterKey, FilterDef> = {
  category: {
    label: "Catégorie",
    param: "categorie",
    values: (p) => [categoryOf(p).id],
    optionLabel: (v) => categoryById(v)?.label ?? v,
    order: indexIn(CATEGORIES.map((c) => c.id)),
  },
  sub: {
    label: "Type",
    param: "type",
    values: (p) => [subOf(p).id],
    optionLabel: (v, scope) => categoryById(scope.category)?.subs.find((s) => s.id === v)?.label ?? v,
    order: (v, scope) => categoryById(scope.category)?.subs.findIndex((s) => s.id === v) ?? 0,
  },
  brand: { label: "Marque", param: "marque", values: (p) => [p.brand], optionLabel: (v) => brandName(v) },
  size: {
    label: "Pointure",
    param: "taille",
    // par tranche : « 40 à 41,5 »
    option: (o) => (o.size === ONE_SIZE ? undefined : sizeRange(o.size)),
    optionLabel: (v) => SIZE_RANGES.find((r) => r.id === v)?.label ?? v,
    order: indexIn(SIZE_RANGES.map((r) => r.id)),
  },
  color: { label: "Couleur", param: "couleur", values: (p) => [p.color], order: indexIn(COLORS.map((c) => c.id)) },
  price: {
    label: "Prix",
    param: "prix",
    // le prix peut dépendre de l'état : chaque exemplaire compte avec le sien
    option: (o, p) => priceRange(priceOf(p, o)),
    optionLabel: (v) => PRICE_RANGES.find((r) => r.id === v)?.label ?? v,
    order: indexIn(PRICE_RANGES.map((r) => r.id)),
  },
  availability: {
    label: "Disponibilité",
    param: "dispo",
    option: (o) => (o.stock > 0 ? "disponible" : "vendu"),
    optionLabel: (v) => (v === "vendu" ? "Vendu" : "Disponible"),
    order: indexIn(["disponible", "vendu"]),
  },
  model: { label: "Modèle", param: "modele", values: (p) => [p.model] },
  gender: { label: "Genre", param: "genre", values: (p) => [p.gender], order: indexIn(["Homme", "Femme", "Mixte"]) },
  condition: {
    label: "État",
    param: "etat",
    // « neuf », « occasion-9 », « occasion-8 »… (« occasion » : toutes les notes)
    option: conditionCode,
    optionLabel: conditionCodeLabel,
    order: conditionRank,
  },
  collab: { label: "Collaboration", param: "collab", values: (p) => [p.collab] },
  movement: { label: "Mouvement", param: "mouvement", values: (p) => [p.attributes?.movement] },
  caseSize: { label: "Taille du boîtier", param: "boitier", values: (p) => [p.attributes?.caseSize], order: (v) => parseFloat(v) || 0 },
  material: { label: "Matière", param: "matiere", values: (p) => [p.attributes?.material] },
  strap: { label: "Type de bracelet", param: "bracelet", values: (p) => [p.attributes?.strap] },
  dimension: {
    label: "Taille",
    param: "dimension",
    values: (p) => [p.attributes?.dimension],
    order: indexIn(["Mini", "Petit", "Moyen", "Grand"]),
  },
};

const KEYS = Object.keys(FILTERS) as FilterKey[];

export const filterLabel = (key: FilterKey, scope: Scope) =>
  key === "sub" ? (categoryById(scope.category)?.subLabel ?? "Type") : FILTERS[key].label;

export const optionLabel = (key: FilterKey, v: string, scope: Scope) => FILTERS[key].optionLabel?.(v, scope) ?? v;

// --- adresse de la page ------------------------------------------------------

// Le filtre Pointure porte des tranches (« 40-42 »). Les anciens liens portent
// des pointures (« 40.5 », ou « 40,5 » coupé en « 40 » et « 5 » par la liste) :
// elles sont ramenées à leur tranche.
function sizeRangesFromUrl(parts: string[]) {
  const ranges: string[] = [];
  const sizes: string[] = [];
  for (const part of parts) {
    if (SIZE_RANGES.some((r) => r.id === part)) ranges.push(part);
    else if (/^\d$/.test(part) && sizes.length && !sizes[sizes.length - 1].includes(",")) sizes[sizes.length - 1] += `,${part}`;
    else sizes.push(part.replace(".", ","));
  }
  return [...ranges, ...sizes.map(sizeRange).filter((r): r is string => Boolean(r))];
}

export function readState(params: URLSearchParams): ShopState {
  const sel: Selection = {};
  for (const key of KEYS) {
    const parts = params.get(FILTERS[key].param)?.split(",").filter(Boolean) ?? [];
    const values = key === "size" ? sizeRangesFromUrl(parts) : parts;
    if (values.length) sel[key] = [...new Set(values)];
  }
  // anciens liens : ?epuises=1 affichait aussi les articles vendus
  if (params.get("epuises") === "1" && !sel.availability) sel.availability = ["disponible", "vendu"];
  const sort = params.get("tri") as SortKey | null;
  return {
    q: params.get("q") ?? "",
    sort: SORTS.some((s) => s.id === sort) ? (sort as SortKey) : "nouveautes",
    sel,
  };
}

export function writeState(s: ShopState): string {
  const p = new URLSearchParams();
  if (s.q) p.set("q", s.q);
  for (const key of KEYS) {
    const values = s.sel[key];
    if (values?.length) p.set(FILTERS[key].param, values.join(","));
  }
  if (s.sort !== "nouveautes") p.set("tri", s.sort);
  return p.toString();
}

export const activeCount = (sel: Selection) => KEYS.reduce((n, k) => n + (sel[k]?.length ?? 0), 0);

// --- filtrage ----------------------------------------------------------------

export const inScope = (p: Product, scope: Scope) =>
  (!scope.category || categoryOf(p).id === scope.category) &&
  (!scope.sub || subOf(p).id === scope.sub) &&
  (!scope.brand || p.brand === scope.brand);

const matchesQuery = (p: Product, q: string) => {
  const hay = [fullName(p), p.colorway, p.collab, p.model, categoryOf(p).label, subOf(p).label]
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
};

/** exemplaires (pointure + état) qui respectent les filtres, sauf `skip` */
function matchingOptions(p: Product, sel: Selection, skip?: FilterKey) {
  return p.sizes.filter((o) =>
    KEYS.every((key) => {
      const def = FILTERS[key];
      if (!def.option || key === skip) return true;
      const wanted = sel[key];
      // par défaut, les articles vendus sont masqués
      if (!wanted?.length) return key !== "availability" || o.stock > 0;
      const v = def.option(o, p);
      // anciens liens ?etat=occasion : toutes les notes
      if (key === "condition" && v?.startsWith("occasion") && wanted.includes("occasion")) return true;
      return v !== undefined && wanted.includes(v);
    }),
  );
}

function matchesProductFilters(p: Product, sel: Selection, skip?: FilterKey) {
  return KEYS.every((key) => {
    const def = FILTERS[key];
    const wanted = sel[key];
    if (!def.values || key === skip || !wanted?.length) return true;
    return def.values(p).some((v) => v !== undefined && wanted.includes(v));
  });
}

const passes = (p: Product, s: ShopState, skip?: FilterKey) =>
  (!s.q || matchesQuery(p, s.q)) && matchesProductFilters(p, s.sel, skip) && matchingOptions(p, s.sel, skip).length > 0;

export function results(products: Product[], scope: Scope, s: ShopState) {
  return products
    .filter((p) => inScope(p, scope) && passes(p, s))
    .sort((a, b) => {
      if (s.sort === "prix-asc") return priceSpan(a).min - priceSpan(b).min;
      if (s.sort === "prix-desc") return priceSpan(b).min - priceSpan(a).min;
      return b.arrivedAt.localeCompare(a.arrivedAt);
    });
}

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

/**
 * Options d'un filtre avec le nombre d'articles que chacune donnerait, compte
 * tenu des autres filtres actifs.
 */
export function facet(products: Product[], scope: Scope, s: ShopState, key: FilterKey): FacetOption[] {
  const def = FILTERS[key];
  const counts = new Map<string, number>();
  const all = new Set<string>();
  for (const p of products) {
    if (!inScope(p, scope)) continue;
    const valuesOf = (opts: SizeOption[]) =>
      def.option ? opts.map((o) => def.option!(o, p)) : (def.values?.(p) ?? []);
    for (const v of valuesOf(p.sizes)) if (v !== undefined) all.add(v);
    // toutes les tranches de pointures sont proposées, même celles absentes du stock
    if (key === "size" && categoryOf(p).sized) for (const r of SIZE_RANGES) all.add(r.id);
    if (s.q && !matchesQuery(p, s.q)) continue;
    if (!matchesProductFilters(p, s.sel, key)) continue;
    const opts = matchingOptions(p, s.sel, key);
    if (!opts.length) continue;
    for (const v of new Set(valuesOf(opts))) if (v !== undefined) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  const order = def.order ?? (() => 0);
  return [...all]
    .map((value) => ({ value, label: optionLabel(key, value, scope), count: counts.get(value) ?? 0 }))
    .sort((a, b) => order(a.value, scope) - order(b.value, scope) || a.label.localeCompare(b.label, "fr"));
}

/** un filtre n'apparaît que s'il offre un vrai choix (ou s'il est actif) */
export const isUseful = (options: FacetOption[], active: string[] | undefined) =>
  Boolean(active?.length) || options.length > 1;

/** nombre d'articles disponibles par sous-catégorie (les vides sont omises) */
export function subCounts(products: Product[], category: CategoryId) {
  const cat = categoryById(category)!;
  return cat.subs
    .map((sub) => ({
      ...sub,
      count: products.filter((p) => inScope(p, { category, sub: sub.id }) && p.sizes.some((o) => o.stock > 0)).length,
    }))
    .filter((s) => s.count > 0);
}

/** nombre d'articles disponibles par catégorie */
export const categoryCounts = (products: Product[], scope: Omit<Scope, "category"> = {}) =>
  CATEGORIES.map((c) => ({
    ...c,
    count: products.filter((p) => inScope(p, { ...scope, category: c.id }) && p.sizes.some((o) => o.stock > 0)).length,
  }));
