import { Badge } from "@/components/ui/badge";
import { ONE_SIZE } from "@/data/taxonomy";
import type { Product } from "@/data/types";
import { availability, conditionLabel, isNew } from "@/lib/products";

/** Badges posés sur la photo : l'état à gauche, un seul statut à droite. */
export function ProductBadges({ product }: { product: Product }) {
  const avail = availability(product);
  const cond = conditionLabel(product);
  // une montre ou un sac est toujours une pièce unique : inutile de le signaler
  const unique = product.sizes.every((s) => s.size === ONE_SIZE);
  const status =
    avail === "soldout"
      ? { label: "Épuisé", tone: "used" as const, desktopOnly: false }
      : avail === "last" && !unique
        ? { label: "Dernière pièce", tone: "warm" as const, desktopOnly: false }
        : isNew(product)
          ? { label: "Arrivage", tone: "muted" as const, desktopOnly: true }
          : null;

  return (
    <div className="absolute inset-x-2.5 top-2.5 flex flex-wrap items-start justify-between gap-1.5 sm:inset-x-3 sm:top-3">
      <Badge tone={cond === "Neuf" ? "new" : "used"}>{cond}</Badge>
      {status && (
        <Badge tone={status.tone} className={status.desktopOnly ? "max-sm:hidden" : undefined}>
          {status.label}
        </Badge>
      )}
    </div>
  );
}
