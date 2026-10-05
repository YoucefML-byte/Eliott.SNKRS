import { Badge } from "@/components/ui/badge";
import type { Product } from "@/data/types";
import { availability, conditionLabel, isNew } from "@/lib/products";

/** Badges posés sur la photo : état de la paire, stock bas, nouveauté. */
export function ProductBadges({ product }: { product: Product }) {
  const avail = availability(product);
  const cond = conditionLabel(product);
  return (
    <>
      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
        <Badge tone={cond === "Neuf" ? "new" : "used"}>{cond}</Badge>
        {isNew(product) && avail !== "soldout" && <Badge tone="muted">Arrivage</Badge>}
      </div>
      {avail !== "available" && (
        <div className="absolute right-3 top-3">
          <Badge tone={avail === "last" ? "warm" : "used"}>
            {avail === "last" ? "Dernière paire" : "Épuisé"}
          </Badge>
        </div>
      )}
    </>
  );
}
