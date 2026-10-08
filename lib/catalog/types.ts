import type { CategoryId } from "@/data/taxonomy";
import type { Product, ProductAttributes, ProductImage, SizeOption } from "@/data/types";

/** What the admin fills in to put an article online or edit it. */
export interface NewPairInput {
  category: CategoryId;
  subcategory: string;
  name: string;
  brand: string;
  colorway: string;
  price: number;
  /** stock per EU size (condition, grade, number of pairs) — size "TU" for watches, bags… */
  sizes: SizeOption[];
  model?: string;
  gender?: Product["gender"];
  color?: string;
  attributes?: ProductAttributes;
  description: string;
  /** photos in display order, the first one is the main photo: new files, or photos already online */
  photos: (Blob | ProductImage)[];
}

export interface AdminUser {
  email: string;
}

/** Where the pairs live: the browser (demo) or Supabase (production). */
export interface CatalogBackend {
  mode: "demo" | "supabase";
  list(): Promise<Product[]>;
  currentAdmin(): Promise<AdminUser | null>;
  signIn(email: string, password: string): Promise<AdminUser>;
  signOut(): Promise<void>;
  create(input: NewPairInput): Promise<Product>;
  /** edits an article in place (same slug, same address) */
  update(product: Product, input: NewPairInput): Promise<Product>;
  remove(product: Product): Promise<void>;
}
