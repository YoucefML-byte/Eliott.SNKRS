import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Field({
  label,
  id,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }) {
  return (
    <label htmlFor={id} className={cn("grid gap-1.5", className)}>
      <span className="text-sm text-muted">{label}</span>
      <input
        id={id}
        name={id}
        className="h-12 rounded-md border border-line bg-surface px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-dim focus:border-acc user-invalid:border-[#ff6b5c]"
        {...props}
      />
    </label>
  );
}
