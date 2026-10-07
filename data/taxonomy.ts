// Organisation du catalogue : catégorie → sous-catégorie → produits → filtres.
// Les sous-catégories vides ne sont jamais affichées ; les filtres principaux
// et avancés dépendent de la catégorie.

import type { Product } from "./types";

export type CategoryId = "chaussures" | "montres" | "maroquinerie" | "accessoires";

export type FilterKey =
  | "category"
  | "sub"
  | "brand"
  | "size"
  | "color"
  | "price"
  | "availability"
  | "model"
  | "gender"
  | "condition"
  | "collab"
  | "movement"
  | "caseSize"
  | "material"
  | "strap"
  | "dimension";

export interface Subcategory {
  id: string;
  label: string;
}

export interface Category {
  id: CategoryId;
  label: string;
  /** les articles ont des pointures (sinon : taille unique) */
  sized: boolean;
  /** nom du filtre de sous-catégorie sur la page de la catégorie */
  subLabel: string;
  subs: Subcategory[];
  filters: { main: FilterKey[]; more: FilterKey[] };
}

export const CATEGORIES: Category[] = [
  {
    id: "chaussures",
    label: "Chaussures",
    sized: true,
    subLabel: "Type",
    subs: [
      { id: "sneakers", label: "Sneakers" },
      { id: "baskets", label: "Baskets" },
      { id: "boots", label: "Boots" },
      { id: "autres", label: "Autres chaussures" },
    ],
    filters: {
      main: ["brand", "size", "color", "price", "availability"],
      more: ["model", "gender", "condition", "collab"],
    },
  },
  {
    id: "montres",
    label: "Montres",
    sized: false,
    subLabel: "Type",
    subs: [
      { id: "automatiques", label: "Automatiques" },
      { id: "quartz", label: "Quartz" },
      { id: "chronographes", label: "Chronographes" },
      { id: "autres", label: "Autres montres" },
    ],
    filters: {
      main: ["brand", "sub", "price", "availability"],
      more: ["movement", "caseSize", "material", "strap", "condition"],
    },
  },
  {
    id: "maroquinerie",
    label: "Maroquinerie",
    sized: false,
    subLabel: "Catégorie",
    subs: [
      { id: "sacs", label: "Sacs" },
      { id: "sacs-a-main", label: "Sacs à main" },
      { id: "sacs-bandouliere", label: "Sacs bandoulière" },
      { id: "sacs-a-dos", label: "Sacs à dos" },
      { id: "pochettes", label: "Pochettes" },
      { id: "portefeuilles", label: "Portefeuilles" },
      { id: "porte-cartes", label: "Porte-cartes" },
      { id: "ceintures", label: "Ceintures" },
      { id: "petite-maroquinerie", label: "Petite maroquinerie" },
      { id: "autres", label: "Autres" },
    ],
    filters: {
      main: ["brand", "sub", "color", "price", "availability"],
      more: ["material", "dimension", "condition"],
    },
  },
  {
    id: "accessoires",
    label: "Accessoires",
    sized: false,
    subLabel: "Catégorie",
    subs: [
      { id: "lunettes", label: "Lunettes" },
      { id: "bijoux", label: "Bijoux" },
      { id: "ceintures", label: "Ceintures" },
      { id: "casquettes", label: "Casquettes" },
      { id: "autres", label: "Autres accessoires" },
    ],
    filters: {
      main: ["brand", "sub", "price", "availability"],
      more: ["color", "material", "condition"],
    },
  },
];

/** filtres de « Tout le stock » et des pages marque */
export const ALL_FILTERS = {
  main: ["category", "brand", "price", "availability"] as FilterKey[],
  more: ["color", "condition", "collab", "size"] as FilterKey[],
};
export const BRAND_FILTERS = {
  main: ["category", "price", "availability"] as FilterKey[],
  more: ["color", "condition", "size"] as FilterKey[],
};

/** couleur dominante, pour le filtre Couleur (pastille affichée à côté) */
export const COLORS: { id: string; hex: string }[] = [
  { id: "Noir", hex: "#111111" },
  { id: "Blanc", hex: "#ffffff" },
  { id: "Gris", hex: "#9a9d99" },
  { id: "Beige", hex: "#d9c7a7" },
  { id: "Marron", hex: "#6b4a34" },
  { id: "Rouge", hex: "#c8231f" },
  { id: "Rose", hex: "#e7a1b3" },
  { id: "Orange", hex: "#f08a24" },
  { id: "Jaune", hex: "#f2cf2b" },
  { id: "Vert", hex: "#4f6b3a" },
  { id: "Bleu", hex: "#3d7bd9" },
  { id: "Violet", hex: "#7b4fb0" },
  { id: "Argent", hex: "#c7cacc" },
  { id: "Or", hex: "#c9a646" },
  { id: "Multicolore", hex: "conic-gradient(#e33,#fc3,#3c6,#39f,#c3c,#e33)" },
];

export const GENDERS = ["Homme", "Femme", "Mixte"] as const;
export const MOVEMENTS = ["Automatique", "Manuel", "Quartz"] as const;
export const STRAPS = ["Métal", "Cuir", "Caoutchouc", "Tissu", "Autre"] as const;
export const DIMENSIONS = ["Mini", "Petit", "Moyen", "Grand"] as const;

/** taille des articles sans pointure (montres, sacs, accessoires) */
export const ONE_SIZE = "TU";

export const categoryById = (id: string | null | undefined) => CATEGORIES.find((c) => c.id === id);

// Articles enregistrés avant les catégories : ce sont des sneakers.
export const categoryOf = (p: Product): Category => categoryById(p.category) ?? CATEGORIES[0];
export const subOf = (p: Product): Subcategory => {
  const cat = categoryOf(p);
  return cat.subs.find((s) => s.id === p.subcategory) ?? (cat.id === "chaussures" && !p.subcategory ? cat.subs[0] : cat.subs.at(-1)!);
};

export const categoryHref = (cat: CategoryId) => `/${cat}`;
export const subHref = (cat: CategoryId, sub: string) => `/${cat}/${sub}`;
export const brandHref = (brand: string) => `/marques/?m=${encodeURIComponent(brand)}`;

/** « EU 42,5 » pour une pointure, « Taille unique » sinon */
export const sizeText = (size: string) => (size === ONE_SIZE ? "Taille unique" : `EU ${size}`);
