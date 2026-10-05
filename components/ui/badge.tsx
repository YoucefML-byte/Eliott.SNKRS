import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm px-2 py-1 font-mono text-[10px] font-medium uppercase leading-none tracking-[0.12em]",
  {
    variants: {
      tone: {
        new: "bg-acc text-on-acc",
        used: "bg-tile-ink/85 text-white",
        warm: "bg-warm text-tile-ink",
        muted: "bg-black/10 text-tile-ink",
        outline: "border border-line text-muted",
      },
    },
    defaultVariants: { tone: "outline" },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
