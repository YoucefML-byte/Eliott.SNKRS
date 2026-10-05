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
}

export interface SizeOption {
  /** EU size, e.g. "42,5" */
  size: string;
  condition: Condition;
  /** wear grade out of 10 for used pairs */
  grade?: number;
  stock: number;
}

export interface Product {
  slug: string;
  name: string;
  brand: BrandId;
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
  releaseYear: number;
  description: string;
  featured?: boolean;
}

export type BrandId = "nike" | "jordan" | "new-balance" | "adidas" | "off-white" | "sacai" | "nocta";

export interface Brand {
  id: BrandId;
  name: string;
}
