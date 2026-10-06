"use client";

import { useCatalog } from "@/lib/catalog/provider";
import { allSizes, brandsOf, PRICE_RANGES, type Filters } from "@/lib/products";
import { cn } from "@/lib/utils";

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export function FilterPanel({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const { products } = useCatalog();
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  return (
    <div className="grid gap-9">
      <Group title="Marque">
        <ul className="grid gap-1">
          {brandsOf(products).map((b) => {
            const on = filters.brands.includes(b.id);
            const n = b.count;
            return (
              <li key={b.id}>
                <label className="flex cursor-pointer items-center gap-3 py-1.5 text-sm text-muted hover:text-ink has-[:checked]:text-ink">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => set({ brands: toggle(filters.brands, b.id) })}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="grid size-4 place-items-center rounded-[3px] border border-dim peer-checked:border-acc peer-checked:bg-acc peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-acc"
                  >
                    {on && <span className="size-1.5 bg-ground" />}
                  </span>
                  <span className="flex-1">{b.name}</span>
                  <span className="font-mono text-xs text-dim">{n}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </Group>

      <Group title="Pointure EU">
        <div className="grid grid-cols-5 gap-1.5 lg:grid-cols-4">
          {allSizes(products).map((s) => {
            const on = filters.sizes.includes(s);
            return (
              <button
                key={s}
                aria-pressed={on}
                onClick={() => set({ sizes: toggle(filters.sizes, s) })}
                className={cn(
                  "h-10 rounded-md border font-mono text-[13px] tabular-nums transition-colors",
                  on ? "border-acc bg-acc text-on-acc" : "border-line text-muted hover:border-ink hover:text-ink",
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="État">
        <div className="grid grid-cols-3 rounded-md border border-line p-1">
          {(["", "Neuf", "Occasion"] as const).map((c) => (
            <button
              key={c || "all"}
              aria-pressed={filters.condition === c}
              onClick={() => set({ condition: c })}
              className={cn(
                "h-9 rounded-sm text-sm transition-colors",
                filters.condition === c ? "bg-raised text-ink" : "text-muted hover:text-ink",
              )}
            >
              {c || "Tous"}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Prix">
        <ul className="grid gap-1">
          {PRICE_RANGES.map((r) => (
            <li key={r.id}>
              <button
                aria-pressed={filters.price === r.id}
                onClick={() => set({ price: filters.price === r.id ? "" : r.id })}
                className={cn(
                  "flex w-full items-center gap-3 py-1.5 text-left text-sm transition-colors",
                  filters.price === r.id ? "text-ink" : "text-muted hover:text-ink",
                )}
              >
                <span
                  className={cn(
                    "size-4 rounded-full border",
                    filters.price === r.id ? "border-[5px] border-acc" : "border-dim",
                  )}
                />
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      </Group>

      <label className="flex cursor-pointer items-center justify-between gap-4 text-sm text-muted">
        Afficher les paires vendues
        <input
          type="checkbox"
          checked={filters.showSoldOut}
          onChange={(e) => set({ showSoldOut: e.target.checked })}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="relative h-6 w-10 rounded-full bg-raised transition-colors after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-muted after:transition-transform peer-checked:bg-acc/30 peer-checked:after:translate-x-4 peer-checked:after:bg-acc peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-acc"
        />
      </label>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="label mb-4 text-ink">{title}</legend>
      {children}
    </fieldset>
  );
}
