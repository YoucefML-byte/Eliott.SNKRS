"use client";

import { LogOut, Plus, ShieldCheck, X } from "lucide-react";
import Link from "next/link";

import { InstagramIcon } from "@/components/brand/instagram-icon";
import { Logo } from "@/components/brand/logo";
import { Sheet } from "@/components/ui/sheet";
import { SITE } from "@/data/site";
import { useCatalog } from "@/lib/catalog/provider";

import { navMenus } from "./nav-menus";

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { products, admin, setFormOpen, signOut } = useCatalog();
  const menus = navMenus(products);
  return (
    <Sheet open={open} onClose={onClose} side="left" label="Menu" className="max-w-none sm:max-w-[420px]">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <Logo />
        <button onClick={onClose} aria-label="Fermer le menu" className="grid size-11 place-items-center rounded-md hover:bg-raised">
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4" aria-label="Navigation principale">
        <ul className="grid">
          {menus.map((item) => (
            <li key={item.href} className="border-b border-line py-4">
              <Link
                href={item.href}
                onClick={onClose}
                className="flex items-baseline justify-between font-display text-[32px] font-medium uppercase leading-none tracking-tight active:text-acc-ink"
              >
                {item.label}
                <span className="font-mono text-xs text-dim">
                  {item.links.reduce((n, l) => n + l.count, 0) || ""}
                </span>
              </Link>
              {item.links.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {item.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        onClick={onClose}
                        className="block rounded-full border border-line px-3.5 py-2 text-sm text-muted active:border-acc"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {admin && (
        <div className="grid gap-2 border-t border-line px-4 py-4">
          <p className="label text-acc-ink">Mode admin · {admin.email}</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <button
              onClick={() => {
                onClose();
                setFormOpen(true);
              }}
              className="flex flex-col items-center gap-1 rounded-md bg-acc px-2 py-3 text-on-acc"
            >
              <Plus className="size-5" /> Ajouter
            </button>
            <Link href="/admin" onClick={onClose} className="flex flex-col items-center gap-1 rounded-md border border-line px-2 py-3">
              <ShieldCheck className="size-5" /> Espace admin
            </Link>
            <button
              onClick={() => {
                onClose();
                signOut();
              }}
              className="flex flex-col items-center gap-1 rounded-md border border-line px-2 py-3"
            >
              <LogOut className="size-5" /> Déconnexion
            </button>
          </div>
        </div>
      )}

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
