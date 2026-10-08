"use client";

import { ArrowDown } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

import { Logo3D } from "./logo-3d";

/** hauteur de l'en-tête collant (h-16) : l'ouverture reste épinglée juste dessous */
const HEADER = 64;

/**
 * Ouverture de l'accueil : le monogramme en 3D, seul, sans texte. La section
 * reste épinglée pendant que l'on défile : le logo fait un tour complet, puis la
 * page continue normalement (en remontant, il tourne dans l'autre sens).
 */
export function HomeHero() {
  const track = useRef<HTMLElement>(null);
  const progress = useRef(0);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const distance = rect.height - (window.innerHeight - HEADER);
      const p = distance > 0 ? Math.min(Math.max((HEADER - rect.top) / distance, 0), 1) : 0;
      progress.current = p;
      el.style.setProperty("--hero-progress", p.toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const getProgress = useCallback(() => progress.current, []);

  return (
    // 100svh de défilement de plus que l'écran : le temps d'un tour
    <section ref={track} className="relative h-[calc(200svh-4rem)] border-b border-line bg-ground">
      {/* titre de la page pour les moteurs de recherche et les lecteurs d'écran */}
      <h1 className="sr-only">Eliott SNKRS — sneakers, maroquinerie et accessoires authentifiés</h1>
      <div className="sticky top-16 grid h-[calc(100svh-4rem)] place-items-center overflow-hidden px-4">
        {/* halo vert derrière le logo */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 size-[120vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--acc)_22%,transparent),transparent)] lg:size-[70vw]"
        />
        <Logo3D
          progress={getProgress}
          className="relative aspect-square w-[min(88vw,60svh)] lg:w-[min(56vw,680px,68svh)]"
        />

        {/* simple flèche : invite à faire défiler, s'efface dès que l'on défile */}
        <a
          href="#categories"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" });
          }}
          aria-label="Voir les catégories"
          style={{ opacity: "calc(1 - var(--hero-progress, 0) * 5)" }}
          className="absolute bottom-14 left-1/2 grid size-10 -translate-x-1/2 place-items-center text-dim hover:text-ink"
        >
          <ArrowDown className="size-5 motion-safe:animate-bounce" />
        </a>
      </div>
    </section>
  );
}
