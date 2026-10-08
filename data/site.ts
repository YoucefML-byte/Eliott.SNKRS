import { CATEGORIES, type CategoryId } from "./taxonomy";

export const SITE = {
  name: "Eliott SNKRS",
  instagram: "eliott.snkrs",
  instagramUrl: "https://instagram.com/eliott.snkrs",
  instagramDm: "https://ig.me/m/eliott.snkrs",
  freeShippingFrom: 300,
  announcements: [
    "Pièces authentifiées une par une",
    "Expédition suivie sous 48 h",
    "Livraison offerte dès 300 €",
  ],
};

/** navigation principale : les catégories, puis les marques */
export const NAV: { id: CategoryId | "marques"; label: string; href: string }[] = [
  ...CATEGORIES.map((c) => ({ id: c.id, label: c.label, href: `/${c.id}` })),
  { id: "marques", label: "Marques", href: "/marques" },
];
export const SHIPPING = [
  { id: "relais", label: "Point relais", detail: "Mondial Relay · 3 à 5 jours", price: 4.9 },
  { id: "colissimo", label: "Domicile", detail: "Colissimo suivi · 48 h", price: 6.9 },
  { id: "express", label: "Express", detail: "Chronopost · 24 h", price: 12.9 },
] as const;

export type ShippingId = (typeof SHIPPING)[number]["id"];

/** wear grades shown in the condition guide */
export const GRADES = [
  { grade: "Neuf", score: 10, text: "Jamais portée, étiquettes, boîte et accessoires d'origine." },
  { grade: "9/10", score: 9, text: "Portée une ou deux fois. Aucune marque visible à un mètre." },
  { grade: "8/10", score: 8, text: "Légères traces d'usage visibles de près : plis, micro-rayures." },
  { grade: "7/10", score: 7, text: "Portée régulièrement, nettoyée, défauts photographiés." },
];
