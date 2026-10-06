import type { Brand } from "./types";

/** Brands offered in the admin form; any other brand typed there works too. */
export const BRANDS: Brand[] = [
  { id: "nike", name: "Nike" },
  { id: "jordan", name: "Jordan" },
  { id: "adidas", name: "Adidas" },
  { id: "asics", name: "Asics" },
  { id: "new-balance", name: "New Balance" },
  { id: "prada", name: "Prada" },
  { id: "maison-margiela", name: "Maison Margiela" },
  { id: "dior", name: "Dior" },
  { id: "louis-vuitton", name: "Louis Vuitton" },
];

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** "new-balance" -> "New Balance" (also for brands not in the list) */
export const brandName = (id: string) =>
  BRANDS.find((b) => b.id === id)?.name ??
  id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
