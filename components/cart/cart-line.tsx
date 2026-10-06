"use client";

import Link from "next/link";

import { ProductImage } from "@/components/product/product-image";
import { brandName } from "@/data/brands";
import { useCart, type ResolvedLine } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { productHref, sizeLabel } from "@/lib/products";
import { cn } from "@/lib/utils";

import { QuantityStepper } from "./quantity-stepper";

export function CartLineItem({
  line,
  onNavigate,
  large,
}: {
  line: ResolvedLine;
  onNavigate?: () => void;
  large?: boolean;
}) {
  const cart = useCart();
  const { product, option } = line;
  const href = productHref(product.slug);

  return (
    <li className="flex gap-4 py-5">
      <Link
        href={href}
        onClick={onNavigate}
        className={cn("shrink-0 overflow-hidden rounded-md", large ? "w-32 md:w-40" : "w-24")}
      >
        <ProductImage product={product} className="aspect-square" artClassName="w-[92%]" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="label text-muted">{brandName(product.brand)}</p>
            <Link href={href} onClick={onNavigate} className="mt-1 block truncate font-medium hover:text-acc-ink">
              {product.name}
            </Link>
            <p className="truncate text-sm text-muted">{product.colorway}</p>
          </div>
          <p className="shrink-0 font-mono text-sm tabular-nums">{formatPrice(line.total)}</p>
        </div>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-dim">
          EU {line.size} · {sizeLabel(option)}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <QuantityStepper
            value={line.qty}
            max={option.stock}
            onChange={(q) => cart.setQty(product.slug, line.size, q)}
            label={`Quantité, ${product.name} EU ${line.size}`}
          />
          <button
            onClick={() => cart.remove(product.slug, line.size)}
            className="label text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Retirer
          </button>
        </div>
      </div>
    </li>
  );
}
