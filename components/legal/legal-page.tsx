import type { ReactNode } from "react";

import { LEGAL } from "@/data/legal";
import { cn } from "@/lib/utils";

/** Long-form legal page with readable measure and section headings. */
export function LegalPage({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-[760px] px-4 pb-24 pt-10 md:px-8 md:pt-16">
      <p className="label text-acc-ink">Informations légales</p>
      <h1 className="mt-3 font-display text-4xl font-medium uppercase leading-none tracking-tight md:text-6xl">
        {title}
      </h1>
      <p className="mt-4 font-mono text-xs text-dim">Dernière mise à jour : {LEGAL.updatedAt}</p>
      {intro && <div className="mt-6 text-[17px] leading-relaxed text-muted">{intro}</div>}
      <div className="mt-10 grid gap-10">{children}</div>
    </article>
  );
}

export function Section({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-2xl font-medium uppercase tracking-tight md:text-3xl">{title}</h2>
      <div className="mt-4 grid gap-4 leading-relaxed text-ink/85 [&_a]:text-acc-ink [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-5 [&_li]:list-disc [&_ul]:grid [&_ul]:gap-2">
        {children}
      </div>
    </section>
  );
}

/** A legal field; shows a visible placeholder while it is still empty. */
export function Fill({ value, label, className }: { value?: string; label: string; className?: string }) {
  if (value) return <span className={className}>{value}</span>;
  return (
    <mark className={cn("rounded-sm bg-warm/30 px-1 text-ink", className)}>[À compléter : {label}]</mark>
  );
}

/** Simple two-column table used for the processing list. */
export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line">
            {head.map((h) => (
              <th key={h} className="label py-3 pr-4 font-normal text-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line align-top">
              {r.map((c, j) => (
                <td key={j} className="py-3 pr-4 leading-relaxed">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
