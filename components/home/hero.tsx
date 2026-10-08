"use client";

import { ArrowDown } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

import { Logo3D } from "./logo-3d";

/** hauteur de l'en-tête collant (h-16) : l'ouverture reste épinglée juste dessous */
const HEADER = 64;

/**
 * Ouverture de l'accueil : le monogramme en 3D et une phrase à côté. La section
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
      <div className="sticky top-16 h-[calc(100svh-4rem)] overflow-hidden">
        {/* halo vert derrière le logo */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[34%] size-[110vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--acc)_22%,transparent),transparent)] lg:left-[30%] lg:top-1/2 lg:size-[60vw]"
        />
        <div className="relative mx-auto grid h-full max-w-[1360px] content-center items-center gap-6 px-4 pb-6 md:px-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:pb-0">
          <Logo3D
            progress={getProgress}
            className="mx-auto aspect-square w-[min(88vw,40svh)] lg:w-[min(42vw,640px,72svh)]"
          />

          <div className="max-w-[30rem] lg:justify-self-start">
            <p className="font-display text-[34px] font-medium uppercase leading-[1.12] tracking-tight md:text-[52px] md:leading-[1.2]">
              Pièces rares,
              <br />
              authentifiées
              <br />
              <span className="text-acc-ink">une par une.</span>
            </p>
            <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">
              Sneakers, maroquinerie et accessoires, neufs ou d&apos;occasion. Notés sur 10, expédiés sous 48&nbsp;h.
            </p>
            {/* sous le texte sur téléphone, centré en bas sur ordinateur ; s'efface dès que l'on défile */}
            <a
              href="#suite"
              style={{ opacity: "calc(1 - var(--hero-progress, 0) * 5)" }}
              className="label mt-8 flex w-fit items-center gap-2 text-dim hover:text-ink lg:absolute lg:bottom-14 lg:left-1/2 lg:mt-0 lg:-translate-x-1/2"
            >
              Défiler <ArrowDown className="size-3.5 motion-safe:animate-bounce" />
            </a>
          </div>
        </div>
      </div>
      <span id="suite" className="absolute bottom-0" />
    </section>
  );
}
