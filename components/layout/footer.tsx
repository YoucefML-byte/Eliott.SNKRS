"use client";

import { ArrowUpRight, Lock } from "lucide-react";
import Link from "next/link";

import { InstagramIcon } from "@/components/brand/instagram-icon";
import { LogoMark } from "@/components/brand/logo";
import { LEGAL } from "@/data/legal";
import { SHIPPING, SITE } from "@/data/site";
import { brandHref, CATEGORIES, categoryHref } from "@/data/taxonomy";
import { useCatalog } from "@/lib/catalog/provider";
import { formatPrice } from "@/lib/format";
import { brandsOf } from "@/lib/products";

const SHOP = [
  ...CATEGORIES.map((c) => ({ href: categoryHref(c.id), label: c.label })),
  { href: "/marques", label: "Toutes les marques" },
  { href: "/catalogue?tri=nouveautes", label: "Nouveautés" },
];
const HELP = [
  { href: "/cgv/#livraison", label: "Livraison" },
  { href: "/cgv/#retours", label: "Retours sous 14 jours" },
  { href: "/cgv/#authenticite", label: "Authenticité" },
  { href: "/#etats", label: "Guide des états" },
];

const LEGAL_LINKS = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Confidentialité et cookies" },
  { href: "/cgv", label: "CGV" },
];

const PAYMENTS = ["CB", "Visa", "Mastercard", "Apple Pay", "Google Pay", "PayPal"];
// transporteurs, tirés des modes de livraison (« Mondial Relay · 3 à 5 jours »)
const CARRIERS = SHIPPING.map((s) => s.detail.split(" · ")[0].replace(/ suivi$/, ""));

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="label text-[11px] text-white/45">{title}</h2>
      <ul className="mt-5 grid gap-3 text-[15px]">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-white/75 transition-colors hover:text-acc">
        {children}
      </Link>
    </li>
  );
}

export function Footer() {
  const { products } = useCatalog();
  const brands = brandsOf(products.filter((p) => p.sizes.some((o) => o.stock > 0)));
  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      {/* filet néon */}
      <div className="h-1 bg-[linear-gradient(90deg,var(--acc),#00fc5400_70%)]" />

      <div className="mx-auto max-w-[1360px] px-4 pt-16 md:px-8 md:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-8">
          {/* marque */}
          <div className="max-w-sm">
            <Link href="/" aria-label="Eliott SNKRS — accueil" className="inline-flex items-center gap-2.5">
              <LogoMark className="text-white" />
              <span className="font-display text-[26px] font-semibold leading-none">
                eliott<span className="text-acc">.</span>snkrs
              </span>
            </Link>
            <p className="mt-6 leading-relaxed text-white/65">
              Sneakers, maroquinerie et accessoires, neufs et d&apos;occasion, authentifiés un par un et expédiés sous 48&nbsp;h. Livraison
              offerte dès {formatPrice(SITE.freeShippingFrom)}.
            </p>
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-8 inline-flex h-12 items-center gap-3 rounded-md border border-white/20 px-5 font-mono text-[12px] uppercase tracking-[0.14em] transition-colors hover:border-acc hover:text-acc"
            >
              <InstagramIcon className="size-[18px]" />@{SITE.instagram}
              <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:contents">
            <Column title="Boutique">
              {SHOP.map((l) => (
                <FooterLink key={l.href} href={l.href}>
                  {l.label}
                </FooterLink>
              ))}
            </Column>

            <Column title="Marques">
              {brands.slice(0, 6).map((b) => (
                <FooterLink key={b.id} href={brandHref(b.id)}>
                  {b.name}
                </FooterLink>
              ))}
            </Column>

            <Column title="Aide">
              {HELP.map((l) => (
                <FooterLink key={l.href} href={l.href}>
                  {l.label}
                </FooterLink>
              ))}
              <li>
                <a
                  href={SITE.instagramDm}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/75 transition-colors hover:text-acc"
                >
                  Nous écrire
                </a>
              </li>
            </Column>
          </div>
        </div>

        {/* paiement & livraison */}
        <div className="mt-16 flex flex-col gap-6 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 flex items-center gap-2 text-sm text-white/55">
              <Lock className="size-4 text-acc" /> Paiement sécurisé
            </span>
            {PAYMENTS.map((p) => (
              <span
                key={p}
                className="rounded-[3px] border border-white/15 px-2.5 py-1 font-mono text-[11px] tracking-wide text-white/80"
              >
                {p}
              </span>
            ))}
          </div>
          <p className="text-sm text-white/55">
            Expédition avec <span className="text-white/80">{CARRIERS.join(", ")}</span>
          </p>
        </div>
      </div>

      {/* grand logotype */}
      <p
        aria-hidden="true"
        className="pointer-events-none mt-10 select-none whitespace-nowrap bg-[linear-gradient(180deg,rgba(255,255,255,0.13),rgba(255,255,255,0))] bg-clip-text text-center font-display text-[13.5vw] font-semibold uppercase leading-[0.78] tracking-tight text-transparent"
      >
        Eliott snkrs
      </p>

      {/* barre légale */}
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-[1360px] flex-col gap-3 px-4 py-6 text-sm text-white/55 md:flex-row md:items-center md:justify-between md:px-8">
          <p>
            © {new Date().getFullYear()} {LEGAL.brand}. Tous droits réservés.
          </p>
          <nav aria-label="Informations légales">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="underline-offset-4 hover:text-white hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
