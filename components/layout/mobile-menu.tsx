"use client";

import { X } from "lucide-react";
import Link from "next/link";

import { InstagramIcon } from "@/components/brand/instagram-icon";
import { Logo } from "@/components/brand/logo";
import { Sheet } from "@/components/ui/sheet";
import { BRANDS } from "@/data/brands";
import { NAV, SITE } from "@/data/site";

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} side="left" label="Menu" className="max-w-none sm:max-w-[420px]">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <Logo />
        <button onClick={onClose} aria-label="Fermer le menu" className="grid size-11 place-items-center rounded-md hover:bg-raised">
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <ul className="grid">
          {NAV.map((item, i) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onClose}
                className="flex items-baseline justify-between border-b border-line py-4 font-display text-[34px] font-medium uppercase leading-none tracking-tight active:text-acc-ink"
              >
                {item.label}
                <span className="font-mono text-xs text-dim">0{i + 1}</span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="label mt-10 text-dim">Marques</p>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {BRANDS.map((b) => (
            <li key={b.id}>
              <Link
                href={`/catalogue?marque=${b.id}`}
                onClick={onClose}
                className="block rounded-md border border-line px-4 py-3 text-sm hover:border-acc"
              >
                {b.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <ul className="flex flex-wrap gap-x-5 gap-y-1 border-t border-line px-4 pt-4 text-xs text-muted">
        <li>
          <Link href="/mentions-legales" onClick={onClose}>Mentions légales</Link>
        </li>
        <li>
          <Link href="/confidentialite" onClick={onClose}>Confidentialité</Link>
        </li>
        <li>
          <Link href="/cgv" onClick={onClose}>CGV</Link>
        </li>
      </ul>
      <a
        href={SITE.instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-4 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-4 text-sm text-muted"
      >
        <InstagramIcon className="text-acc-ink" />@{SITE.instagram}
      </a>
    </Sheet>
  );
}
