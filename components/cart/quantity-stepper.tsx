"use client";

import { Minus, Plus } from "lucide-react";

export function QuantityStepper({
  value,
  max,
  onChange,
  label,
}: {
  value: number;
  max: number;
  onChange: (qty: number) => void;
  label: string;
}) {
  return (
    <div className="inline-flex h-9 items-center rounded-md border border-line" role="group" aria-label={label}>
      <button
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="Retirer un exemplaire"
        className="grid h-full w-9 place-items-center text-muted hover:text-ink disabled:opacity-30"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-6 text-center font-mono text-sm tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Ajouter un exemplaire"
        title={value >= max ? "Plus de stock dans cette pointure" : undefined}
        className="grid h-full w-9 place-items-center text-muted hover:text-ink disabled:opacity-30"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
