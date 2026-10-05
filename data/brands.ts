import type { Brand } from "./types";

export const BRANDS: Brand[] = [
  { id: "nike", name: "Nike" },
  { id: "jordan", name: "Jordan" },
  { id: "new-balance", name: "New Balance" },
  { id: "adidas", name: "Adidas" },
];

export const brandName = (id: string) => BRANDS.find((b) => b.id === id)?.name ?? id;
