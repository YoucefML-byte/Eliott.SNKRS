"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { COLORS, type FilterKey } from "@/data/taxonomy";
import type { FacetOption } from "@/lib/shop";
import { cn } from "@/lib/utils";

/** Les choix d'un filtre : cases à cocher (avec pastille pour les couleurs). */
export function FilterOptions({
  fkey,
  options,
  selected,
  onToggle,
}: {
  fkey: FilterKey;
  options: FacetOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <ul className="grid gap-0.5">
      {options.map((o) => {
        const on = selected.includes(o.value);
        const swatch = fkey === "color" ? COLORS.find((c) => c.id === o.value)?.hex : undefined;
        return (
          <li key={o.value}>
            <button
              type="button"
              role="checkbox"
              aria-checked={on}
              disabled={!on && o.count === 0}
              onClick={() => onToggle(o.value)}
              className={cn(
                "flex w-full items-center gap-3 rounded-sm px-1 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                on ? "text-ink" : "text-muted hover:text-ink",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded-[3px] border",
                  on ? "border-acc bg-acc text-on-acc" : "border-dim",
                )}
              >
                {on && <Check className="size-3" strokeWidth={3} />}
              </span>
              {swatch && (
                <span
                  aria-hidden="true"
                  className="size-4 shrink-0 rounded-full border border-black/10"
                  style={{ background: swatch }}
                />
              )}
              <span className="flex-1">{o.label}</span>
              <span className="font-mono text-xs tabular-nums text-dim">{o.count}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Bouton de la barre de filtres qui ouvre la liste des choix. */
export function FilterDropdown({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
          count > 0 || open ? "border-ink text-ink" : "border-line text-muted hover:border-ink hover:text-ink",
        )}
      >
        {label}
        {count > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-acc px-1 font-mono text-[10px] font-semibold text-on-acc">
            {count}
          </span>
        )}
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 max-h-[60vh] w-64 overflow-y-auto rounded-md border border-line bg-surface p-3 shadow-xl shadow-black/10">
          {children}
        </div>
      )}
    </div>
  );
}
