import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Price({
  value,
  retail,
  from,
  className,
}: {
  value: number;
  retail?: number;
  /** le prix dépend de l'état : « dès 120 € » */
  from?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-baseline gap-2 font-mono tabular-nums", className)}>
      {from && <span className="text-[0.55em] uppercase tracking-[0.1em] text-muted">dès</span>}
      <span>{formatPrice(value)}</span>
      {retail != null && retail !== value && (
        <span className="text-[0.8em] text-muted">Retail {formatPrice(retail)}</span>
      )}
    </span>
  );
}
