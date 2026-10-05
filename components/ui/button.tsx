import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-mono text-xs font-medium uppercase tracking-[0.14em] transition-[background-color,color,border-color,transform] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-acc text-ground hover:bg-[#5dff8f]",
        outline: "border border-line text-ink hover:border-ink",
        ghost: "text-ink hover:bg-raised",
        light: "bg-ink text-ground hover:bg-white",
        link: "h-auto px-0 text-ink underline-offset-4 hover:text-acc hover:underline",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-12 px-5",
        lg: "h-14 px-7 text-[13px]",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
