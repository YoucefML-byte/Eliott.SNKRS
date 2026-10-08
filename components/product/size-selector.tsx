"use client";

import type { SizeOption } from "@/data/types";
import { sizeValue } from "@/lib/format";
import { conditionCode, conditionRank, optionKey } from "@/lib/products";
import { cn } from "@/lib/utils";

export function SizeSelector({
  sizes,
  value,
  onChange,
  priceLabel,
}: {
  sizes: SizeOption[];
  /** selected stock line (optionKey: a size in one condition) */
  value: string | null;
  onChange: (key: string) => void;
  /** prix sous chaque pointure, quand il dépend de l'état */
  priceLabel?: (o: SizeOption) => string;
}) {
  // une même pointure peut apparaître dans plusieurs états : neuf d'abord
  const sorted = [...sizes].sort(
    (a, b) => sizeValue(a.size) - sizeValue(b.size) || conditionRank(conditionCode(a)) - conditionRank(conditionCode(b)),
  );
  return (
    <div role="radiogroup" aria-label="Pointure" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {sorted.map((s) => {
        const sold = s.stock === 0;
        const key = optionKey(s);
        const active = value === key;
        return (
          <button
            key={key}
            role="radio"
            aria-checked={active}
            disabled={sold}
            onClick={() => onChange(key)}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-md border text-center transition-colors",
              priceLabel ? "h-20" : "h-16",
              active ? "border-acc bg-acc/10" : "border-line hover:border-ink",
              sold && "cursor-not-allowed border-dashed opacity-45",
            )}
          >
            <span className={cn("font-mono text-[15px] tabular-nums", sold && "line-through")}>
              {s.size}
            </span>
            <span
              className={cn(
                "mt-1 font-mono text-[10px] uppercase tracking-[0.1em]",
                s.condition === "Neuf" ? "text-acc-ink" : "text-muted",
              )}
            >
              {sold ? "Vendue" : s.condition === "Neuf" ? "Neuf" : `Occ. ${s.grade}/10`}
            </span>
            {priceLabel && !sold && (
              <span className="mt-1 font-mono text-[12px] tabular-nums text-ink">{priceLabel(s)}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
