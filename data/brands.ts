import type { Brand } from "./types";

export const BRANDS: Brand[] = [
  { id: "nike", name: "Nike" },
  { id: "jordan", name: "Jordan" },
  { id: "asics", name: "Asics" },
  { id: "prada", name: "Prada" },
  { id: "maison-margiela", name: "Maison Margiela" },
];

export const brandName = (id: string) => BRANDS.find((b) => b.id === id)?.name ?? id;
