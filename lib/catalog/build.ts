import { slugify } from "@/data/brands";
import type { Colorway, Product, ProductImage } from "@/data/types";
import { sizeValue } from "@/lib/format";

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

/** new photo files of the form, in order */
export const newPhotos = (input: NewPairInput) => input.photos.filter((p): p is Blob => p instanceof Blob);

/** gallery in the order chosen: photos already online as they were, new ones at the URLs they were stored at */
export function imagesFrom(input: NewPairInput, newUrls: string[]): ProductImage[] {
  let next = 0;
  return input.photos.map((photo, i) =>
    photo instanceof Blob
      ? { view: i === 0 ? "side" : "detail", src: newUrls[next++], label: PHOTO_LABELS[i] ?? `Photo ${i + 1}` }
      : photo,
  );
}

/** what the admin form sets on an article */
const formFields = (input: NewPairInput, images: ProductImage[]) => ({
  name: input.name.trim(),
  brand: slugify(input.brand),
  category: input.category,
  subcategory: input.subcategory,
  model: input.model || undefined,
  gender: input.gender,
  color: input.color || undefined,
  attributes: input.attributes,
  colorway: input.colorway.trim(),
  price: input.price,
  sizes: [...input.sizes].sort((a, b) => sizeValue(a.size) - sizeValue(b.size)),
  images,
  description: input.description.trim(),
});

/** Product object for a new article. */
export const buildProduct = (input: NewPairInput, slug: string, images: ProductImage[]): Product => ({
  slug,
  silhouette: "low",
  colors: NEUTRAL_COLORS,
  arrivedAt: new Date().toISOString().slice(0, 10),
  ...formFields(input, images),
});

/** The article after an edit: same slug and arrival date, the rest from the form. */
export const editedProduct = (product: Product, input: NewPairInput, images: ProductImage[]): Product => ({
  ...product,
  ...formFields(input, images),
});
