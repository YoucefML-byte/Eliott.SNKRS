import type { CategoryId } from "./taxonomy";

export type Silhouette = "low" | "high" | "runner";

export type ImageView = "side" | "medial" | "pair" | "detail";

export type Condition = "Neuf" | "Occasion";

/** Panel colours for the placeholder render. */
export interface Colorway {
  upper: string;
  overlay: string;
  accent: string;
  midsole: string;
  outsole: string;
  laces: string;
  toe?: string;
  heel?: string;
  tongue?: string;
  lining?: string;
}

export interface ProductImage {
  view: ImageView;
  /** real photo; when absent the studio render is used */
  src?: string;
  /** caption in the gallery, e.g. "Vue avant" */
  label?: string;
}

/**
 * A stock line: a size in one condition. The same size can appear twice in
 * different conditions (42 new and 42 used 6/10).
 */
export interface SizeOption {
  /** EU size, e.g. "42,5" — or "TU" (taille unique) for watches, bags… */
  size: string;
  condition: Condition;
  /** wear grade out of 10 for used pairs */
  grade?: number;
  stock: number;
}

/** caractéristiques propres à certaines catégories */
export interface ProductAttributes {
  /** montres : Automatique, Manuel, Quartz */
  movement?: string;
  /** montres : diamètre du boîtier, ex. « 40 mm » */
  caseSize?: string;
  /** matière principale : acier, cuir, toile… */
  material?: string;
  /** montres : Métal, Cuir, Caoutchouc… */
  strap?: string;
  /** maroquinerie : Mini, Petit, Moyen, Grand */
  dimension?: string;
}

export interface Product {
  /** database id (absent for the bundled demo pairs) */
  id?: string;
  slug: string;
  name: string;
  brand: BrandId;
  /** catégorie (data/taxonomy.ts) ; absente = chaussures */
  category?: CategoryId;
  /** sous-catégorie de la catégorie, ex. "sneakers", "sacs-a-main" */
  subcategory?: string;
  /** modèle, ex. « Air Jordan 1 », « Speedmaster » */
  model?: string;
  gender?: "Homme" | "Femme" | "Mixte";
  /** couleur dominante (COLORS) */
  color?: string;
  attributes?: ProductAttributes;
  /** collaboration or colorway line shown under the name */
  colorway: string;
  collab?: string;
  silhouette: Silhouette;
  colors: Colorway;
  price: number;
  /** original retail price, shown as a reference */
  retail?: number;
  sizes: SizeOption[];
  images: ProductImage[];
  /** ISO date the pair arrived in stock */
  arrivedAt: string;
  releaseYear?: number;
  description: string;
  featured?: boolean;
}

/** brand slug, e.g. "new-balance"; known brands are listed in data/brands.ts */
export type BrandId = string;

export interface Brand {
  id: BrandId;
  name: string;
}
