"use client";

import { LogOut, Menu, Plus, Search, ShieldCheck, ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Logo, LogoMark } from "@/components/brand/logo";
import { useCart } from "@/lib/cart";
import { useCatalog } from "@/lib/catalog/provider";
import { cn } from "@/lib/utils";

import { MobileMenu } from "./mobile-menu";
import { navMenus } from "./nav-menus";
import { SearchOverlay } from "./search-overlay";

export function Header() {
  const cart = useCart();
  const { admin, setFormOpen, signOut, products } = useCatalog();
  const menus = navMenus(products);
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-ground/90 backdrop-blur-md">
        <div
          className={cn(
            "mx-auto grid h-16 max-w-[1360px] items-center px-2 md:px-8 lg:grid-cols-[auto_1fr_auto]",
            // en mode admin, une icône de plus : le logo se décale un peu sur téléphone
            admin ? "grid-cols-[auto_1fr_auto]" : "grid-cols-[1fr_auto_1fr]",
          )}
        >
          {/* left: menu (mobile) / logo (desktop) */}
          <div className="flex items-center">
            <button
              onClick={() => setMenu(true)}
              aria-label="Ouvrir le menu"
              className="grid size-11 place-items-center rounded-md hover:bg-raised lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            <Link href="/" aria-label="Eliott SNKRS — accueil" className="hidden lg:block">
              <Logo />
            </Link>
          </div>

          {/* centre: logo (mobile) / nav (desktop) */}
          <Link href="/" aria-label="Eliott SNKRS — accueil" className="justify-self-center lg:hidden">
            <span className="flex items-center gap-2">
              <LogoMark className="size-7" />
              <span className={cn("font-display text-xl font-semibold", admin && "max-[370px]:hidden")}>
                eliott<span className="text-acc-ink">.</span>snkrs
              </span>
            </span>
          </Link>
          <nav className="hidden justify-center lg:flex" aria-label="Navigation principale">
            <ul className="flex items-center">
              {menus.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <li key={item.href} className="group relative">
                    <Link
                      href={item.href}
                      className={cn(
                        "label relative block px-3.5 py-6 text-[12px] text-muted transition-colors hover:text-ink xl:px-4",
                        active && "text-ink",
                      )}
                    >
                      {item.label}
                      <span
                        className={cn(
                          "absolute inset-x-3.5 bottom-4 h-px origin-left scale-x-0 bg-acc transition-transform duration-300 group-hover:scale-x-100 xl:inset-x-4",
                          active && "scale-x-100",
                        )}
                      />
                    </Link>
                    <div className="invisible absolute left-1/2 top-full w-60 -translate-x-1/2 translate-y-1 rounded-md border border-line bg-surface p-2 opacity-0 shadow-xl shadow-black/10 transition-all group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                      {item.links.length ? (
                        item.links.map((l) => (
                          <Link
                            key={l.href}
                            href={l.href}
                            className="flex items-baseline justify-between rounded-sm px-3 py-2.5 text-sm text-muted hover:bg-raised hover:text-ink"
                          >
                            {l.label}
                            <span className="font-mono text-[11px] text-dim">{l.count}</span>
                          </Link>
                        ))
                      ) : (
                        <p className="px-3 py-2.5 text-sm text-dim">Arrivages en préparation</p>
                      )}
                      <Link
                        href={item.href}
                        className="label mt-1 block border-t border-line px-3 pb-1.5 pt-3 text-[11px] text-acc-ink hover:text-ink"
                      >
                        {item.id === "marques" ? "Toutes les marques" : `Tout voir · ${item.label}`} →
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* right: search + cart */}
          <div className={cn("flex items-center justify-end", admin ? "gap-0 sm:gap-1" : "gap-1")}>
            {admin && (
              <>
                <button
                  onClick={() => setFormOpen(true)}
                  aria-label="Ajouter un article"
                  className="hidden h-9 items-center gap-1.5 rounded-md bg-acc px-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-on-acc hover:bg-[#5dff8f] sm:inline-flex"
                >
                  <Plus className="size-4" /> Ajouter un article
                </button>
                <button
                  onClick={() => setFormOpen(true)}
                  aria-label="Ajouter un article"
                  className="grid size-10 place-items-center rounded-md text-acc-ink hover:bg-raised sm:hidden"
                >
                  <Plus className="size-5" />
                </button>
                <Link
                  href="/admin"
                  aria-label="Espace admin"
                  title="Espace admin"
                  className="hidden size-11 place-items-center rounded-md hover:bg-raised sm:grid"
                >
                  <ShieldCheck className="size-5" />
                </Link>
                <button
                  onClick={signOut}
                  aria-label="Se déconnecter"
                  title="Se déconnecter"
                  className="grid size-10 place-items-center rounded-md hover:bg-raised sm:size-11"
                >
                  <LogOut className="size-5" />
                </button>
              </>
            )}
            <button
              onClick={() => setSearch(true)}
              aria-label="Rechercher"
              className={cn("grid place-items-center rounded-md hover:bg-raised", admin ? "size-10 sm:size-11" : "size-11")}
            >
              <Search className="size-5" />
            </button>
            {!admin && (
            <button
              onClick={() => cart.setOpen(true)}
              aria-label={`Panier, ${cart.count} article${cart.count > 1 ? "s" : ""}`}
              className={cn("relative grid place-items-center rounded-md hover:bg-raised", admin ? "size-10 sm:size-11" : "size-11")}
            >
              <ShoppingBag className="size-5" />
              <AnimatePresence>
                {cart.count > 0 && (
                  <motion.span
                    key={cart.count}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    className="absolute right-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-acc px-1 font-mono text-[10px] font-semibold text-on-acc"
                  >
                    {cart.count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            )}
          </div>
        </div>
      </header>

      <MobileMenu open={menu} onClose={() => setMenu(false)} />
      <SearchOverlay open={search} onClose={() => setSearch(false)} />
    </>
  );
}
