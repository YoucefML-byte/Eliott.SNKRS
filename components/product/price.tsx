import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Price({
  value,
  retail,
  className,
}: {
  value: number;
  retail?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-baseline gap-2 font-mono tabular-nums", className)}>
      <span>{formatPrice(value)}</span>
      {retail != null && retail !== value && (
        <span className="text-[0.8em] text-muted">Retail {formatPrice(retail)}</span>
      )}
    </span>
  );
}
