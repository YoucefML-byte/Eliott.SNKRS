import { PackageCheck, ShieldCheck, Truck } from "lucide-react";

import { InstagramIcon } from "@/components/brand/instagram-icon";

import { SITE } from "@/data/site";
import { formatPrice } from "@/lib/format";

const ITEMS = [
  { icon: ShieldCheck, title: "Authentifiée", text: "Chaque paire est contrôlée à la main avant l'envoi." },
  { icon: Truck, title: "Expédiée sous 48 h", text: `Envoi suivi, livraison offerte dès ${formatPrice(SITE.freeShippingFrom)}.` },
  { icon: PackageCheck, title: "Bien emballée", text: "Double boîte et protection pour que la boîte arrive intacte." },
];

export function Services() {
  return (
    <section className="mx-auto max-w-[1360px] px-4 py-20 md:px-8 md:py-28">
      <ul className="grid gap-10 md:grid-cols-3 md:gap-8">
        {ITEMS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="border-t border-line pt-6">
            <Icon className="size-6 text-acc" strokeWidth={1.6} />
            <h3 className="mt-5 font-display text-2xl font-medium uppercase">{title}</h3>
            <p className="mt-2 max-w-[34ch] text-muted">{text}</p>
          </li>
        ))}
      </ul>

      <div className="mt-20 flex flex-col items-start justify-between gap-8 rounded-md border border-line bg-[radial-gradient(80%_140%_at_0%_0%,rgba(0,252,84,0.12),transparent_60%)] p-8 md:flex-row md:items-center md:p-12">
        <div>
          <h2 className="font-display text-3xl font-medium uppercase leading-none tracking-tight md:text-5xl">
            Une paire introuvable ?
          </h2>
          <p className="mt-4 max-w-[48ch] text-muted">
            Eliott cherche pour toi. Envoie le modèle et ta pointure en message privé.
          </p>
        </div>
        <a
          href={SITE.instagramDm}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-14 shrink-0 items-center gap-3 rounded-md bg-acc px-7 font-mono text-[13px] font-medium uppercase tracking-[0.14em] text-ground transition-colors hover:bg-[#5dff8f]"
        >
          <InstagramIcon /> @{SITE.instagram}
        </a>
      </div>
    </section>
  );
}
