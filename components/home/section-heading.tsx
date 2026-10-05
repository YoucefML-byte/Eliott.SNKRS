import Link from "next/link";
import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  href,
  cta,
}: {
  eyebrow: string;
  title: ReactNode;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6 md:mb-12">
      <div>
        <p className="label text-acc">{eyebrow}</p>
        <h2 className="mt-3 font-display text-4xl font-medium uppercase leading-[0.95] tracking-tight md:text-6xl">
          {title}
        </h2>
      </div>
      {href && (
        <Link href={href} className="label shrink-0 pb-1 text-muted transition-colors hover:text-acc">
          {cta} →
        </Link>
      )}
    </div>
  );
}
