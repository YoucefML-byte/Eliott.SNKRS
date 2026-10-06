import { slugify } from "@/data/brands";
import type { Colorway, Product, SizeOption } from "@/data/types";

import type { NewPairInput } from "./types";

// Neutral colours for the drawn fallback (only shown if a pair had no photo).
export const NEUTRAL_COLORS: Colorway = {
  upper: "#e9e9e6",
  overlay: "#cfcfcb",
  accent: "#111111",
  midsole: "#f4f4f2",
  outsole: "#3a3a3a",
  laces: "#f4f4f2",
};

export const PHOTO_LABELS = ["Profil", "Vue latérale", "Vue avant", "Vue arrière", "Semelle"];

/** unique, readable URL slug: "air-max-95-corteiz-k3f9" */
export const makeSlug = (input: Pick<NewPairInput, "brand" | "name" | "colorway">) =>
  `${slugify(`${input.name} ${input.colorway}`).slice(0, 60)}-${Math.random().toString(36).slice(2, 6)}`;

export const sizesFrom = (input: NewPairInput): SizeOption[] =>
  input.sizes.map((size) => ({
    size,
    condition: input.condition,
    grade: input.condition === "Occasion" ? input.grade : undefined,
    stock: 1,
  }));

/** Product object for a new pair, given the URLs its photos were stored at. */
export function buildProduct(input: NewPairInput, slug: string, photoUrls: string[]): Product {
  return {
    slug,
    name: input.name.trim(),
    brand: slugify(input.brand),
    colorway: input.colorway.trim(),
    silhouette: "low",
    colors: NEUTRAL_COLORS,
    price: input.price,
    sizes: sizesFrom(input),
    images: photoUrls.map((src, i) => ({
      view: i === 0 ? "side" : "detail",
      src,
      label: PHOTO_LABELS[i] ?? `Photo ${i + 1}`,
    })),
    arrivedAt: new Date().toISOString().slice(0, 10),
    description: input.description.trim(),
  };
}
