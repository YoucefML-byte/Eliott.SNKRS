import { NAV } from "@/data/site";
import { brandHref, subHref } from "@/data/taxonomy";
import type { Product } from "@/data/types";
import { brandsOf } from "@/lib/products";
import { subCounts } from "@/lib/shop";

/** Entrées du menu avec leurs sous-rayons non vides (ou les marques en stock). */
export function navMenus(products: Product[]) {
  const available = products.filter((p) => p.sizes.some((o) => o.stock > 0));
  return NAV.map((item) => {
    const id = item.id;
    const links =
      id === "marques"
        ? brandsOf(available)
            .slice(0, 10)
            .map((b) => ({ label: b.name, href: brandHref(b.id), count: b.count }))
        : subCounts(products, id).map((s) => ({ label: s.label, href: subHref(id, s.id), count: s.count }));
    return { ...item, links };
  });
}
