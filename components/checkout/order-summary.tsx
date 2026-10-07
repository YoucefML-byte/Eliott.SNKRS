import { ProductImage } from "@/components/product/product-image";
import { sizeText } from "@/data/taxonomy";
import type { Product } from "@/data/types";
import type { ResolvedLine } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

export interface SummaryLine {
  key: string;
  name: string;
  detail: string;
  qty: number;
  total: number;
  /** pour la photo ; absente si la paire a été retirée du site depuis */
  product?: Product;
}

export const cartSummaryLines = (lines: ResolvedLine[]): SummaryLine[] =>
  lines.map((l) => ({
    key: l.slug + l.size,
    name: l.product.name,
    detail: [l.product.colorway, sizeText(l.size)].filter(Boolean).join(" · "),
    qty: l.qty,
    total: l.total,
    product: l.product,
  }));

export function OrderSummary({
  lines,
  subtotal,
  shipping,
}: {
  lines: SummaryLine[];
  subtotal: number;
  shipping: number | null;
}) {
  return (
    <div>
      <ul className="grid gap-4">
        {lines.map((l) => (
          <li key={l.key} className="flex items-center gap-4">
            <div className="relative shrink-0">
              {l.product ? (
                <ProductImage product={l.product} className="size-16 rounded-md" artClassName="w-[95%]" />
              ) : (
                <div className="size-16 rounded-md bg-tile" />
              )}
              <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-raised font-mono text-[10px] text-ink">
                {l.qty}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{l.name}</p>
              <p className="truncate text-xs text-muted">{l.detail}</p>
            </div>
            <span className="font-mono text-sm tabular-nums">{formatPrice(l.total)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-6 grid gap-2 border-t border-line pt-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Sous-total</dt>
          <dd className="font-mono tabular-nums">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Livraison</dt>
          <dd className="font-mono tabular-nums">
            {shipping == null ? "—" : shipping === 0 ? "Offerte" : formatPrice(shipping)}
          </dd>
        </div>
        <div className="mt-3 flex items-baseline justify-between border-t border-line pt-4">
          <dt>Total</dt>
          <dd className="font-mono text-xl tabular-nums">{formatPrice(subtotal + (shipping ?? 0))}</dd>
        </div>
      </dl>
    </div>
  );
}
