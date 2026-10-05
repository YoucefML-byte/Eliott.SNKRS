import { SITE } from "@/data/site";
import { formatPrice } from "@/lib/format";

export function ShippingProgress({ subtotal }: { subtotal: number }) {
  const left = SITE.freeShippingFrom - subtotal;
  const pct = Math.min(100, (subtotal / SITE.freeShippingFrom) * 100);
  return (
    <div>
      <p className="text-sm text-muted">
        {left > 0 ? (
          <>
            Plus que <span className="font-mono text-ink">{formatPrice(left)}</span> pour la livraison offerte
          </>
        ) : (
          <span className="text-acc-ink">Livraison offerte sur cette commande</span>
        )}
      </p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-raised">
        <div className="h-full rounded-full bg-acc transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
