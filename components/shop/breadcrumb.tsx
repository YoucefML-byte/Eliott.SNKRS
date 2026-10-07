import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}

/** Accueil / Maroquinerie / Sacs — le dernier élément est la page en cours. */
export function Breadcrumb({ crumbs, className }: { crumbs: Crumb[]; className?: string }) {
  const all = [{ label: "Accueil", href: "/" }, ...crumbs];
  return (
    <nav aria-label="Fil d'Ariane" className={className}>
      <ol className="label flex flex-wrap items-center gap-x-2 gap-y-1 text-dim">
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={c.label + i} className="flex items-center gap-2">
              {last || !c.href ? (
                <span aria-current={last ? "page" : undefined} className={last ? "text-ink" : undefined}>
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className="transition-colors hover:text-ink">
                  {c.label}
                </Link>
              )}
              {!last && <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
