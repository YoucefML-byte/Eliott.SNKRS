"use client";

import { ArrowDown } from "lucide-react";

import { Wordmark } from "@/components/brand/logo";

import { Logo3D } from "./logo-3d";

/** Ouverture de l'accueil : le monogramme en 3D qui tourne, et une phrase à côté. */
export function HomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-ground">
      {/* halo vert derrière le logo */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[34%] size-[110vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--acc)_22%,transparent),transparent)] lg:left-[30%] lg:top-1/2 lg:size-[60vw]"
      />
      <div className="relative mx-auto grid min-h-[calc(100svh-104px)] max-w-[1360px] items-center gap-6 px-4 pb-16 pt-8 md:px-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:py-12">
        <Logo3D className="mx-auto aspect-square w-full max-w-[min(88vw,560px)] lg:max-w-[640px]" />

        <div className="max-w-[30rem] lg:justify-self-start">
          <Wordmark className="text-[28px] md:text-[34px]" />
          <p className="mt-5 font-display text-[34px] font-medium uppercase leading-[1.12] tracking-tight md:text-[52px]">
            Pièces rares,
            <br />
            authentifiées
            <br />
            <span className="text-acc-ink">une par une.</span>
          </p>
          <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">
            Sneakers, maroquinerie et accessoires, neufs ou d&apos;occasion. Notés sur 10, expédiés sous 48 h.
          </p>
        </div>

        <a
          href="#suite"
          className="label absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 text-dim hover:text-ink"
        >
          Défiler <ArrowDown className="size-3.5 motion-safe:animate-bounce" />
        </a>
      </div>
      <span id="suite" className="absolute bottom-0" />
    </section>
  );
}
