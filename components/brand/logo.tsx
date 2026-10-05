import { cn } from "@/lib/utils";

/** Monogramme : trois barres vertes et le contour du « E » (repris du site actuel). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-8", className)} aria-hidden="true">
      <path d="M2 14 L32 9 V19 L2 24 Z M2 30 L32 25 V35 L2 40 Z M2 46 L32 41 V51 L2 56 Z" fill="var(--acc)" />
      <path
        d="M32 9 L62 4 V14 L32 19 M32 25 L62 20 V44 L32 51 M32 35 L54 31 V40 L32 44"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-[22px] font-semibold leading-none tracking-[0.01em]", className)}>
      eliott<span className="text-acc-ink">.</span>snkrs
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <Wordmark />
    </span>
  );
}
