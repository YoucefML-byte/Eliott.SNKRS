import type { Condition, Product } from "@/data/types";

/** What the admin fills in to put a pair online. */
export interface NewPairInput {
  name: string;
  brand: string;
  colorway: string;
  price: number;
  condition: Condition;
  /** wear grade /10, used pairs only */
  grade?: number;
  /** EU sizes available, one pair each */
  sizes: string[];
  description: string;
  /** photos in display order, the first one is the main photo */
  photos: Blob[];
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
  remove(product: Product): Promise<void>;
}
