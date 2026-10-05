"use client";

import type { SizeOption } from "@/data/types";
import { sizeValue } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SizeSelector({
  sizes,
  value,
  onChange,
}: {
  sizes: SizeOption[];
  value: string | null;
  onChange: (size: string) => void;
}) {
  const sorted = [...sizes].sort((a, b) => sizeValue(a.size) - sizeValue(b.size));
  return (
    <div role="radiogroup" aria-label="Pointure" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {sorted.map((s) => {
        const sold = s.stock === 0;
        const active = value === s.size;
        return (
          <button
            key={s.size}
            role="radio"
            aria-checked={active}
            disabled={sold}
            onClick={() => onChange(s.size)}
            className={cn(
              "relative flex h-16 flex-col items-center justify-center rounded-md border text-center transition-colors",
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
                s.condition === "Neuf" ? "text-acc" : "text-muted",
              )}
            >
              {sold ? "Vendue" : s.condition === "Neuf" ? "Neuf" : `Occ. ${s.grade}/10`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
