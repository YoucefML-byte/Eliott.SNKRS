import Link from "next/link";

import { LEGAL } from "@/data/legal";

const LINKS = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Confidentialité et cookies" },
  { href: "/cgv", label: "CGV" },
];

/** Legal links required on every page (the full footer comes later). */
export function LegalBar() {
  return (
    <div className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-3 px-4 py-6 text-sm text-muted md:flex-row md:items-center md:justify-between md:px-8">
        <p>
          © {new Date().getFullYear()} {LEGAL.brand}
        </p>
        <nav aria-label="Informations légales">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="underline-offset-4 hover:text-ink hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
