"use client";

import { Printer, Scissors, X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { LogoMark } from "@/components/brand/logo";
import { Fill } from "@/components/legal/legal-page";
import { Button } from "@/components/ui/button";
import { LEGAL } from "@/data/legal";
import { SHIPPING, SITE } from "@/data/site";
import { sizeText } from "@/data/taxonomy";
import { formatPrice } from "@/lib/format";
import type { AdminOrder } from "@/lib/orders";
import { conditionCodeLabel } from "@/lib/products";

export type DocKind = "invoice" | "slip";

/** « Domicile · Colissimo suivi » : le mode choisi et son transporteur */
const shippingText = (label: string) => {
  const s = SHIPPING.find((x) => x.label === label);
  return s ? `${s.label} · ${s.detail.split(" · ")[0]}` : label;
};

const longDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/**
 * Aperçu d'une facture ou d'un bordereau, puis impression (ou « Enregistrer en
 * PDF » depuis la fenêtre d'impression). À l'impression, seule la feuille sort :
 * voir `#print-root` dans globals.css.
 */
export function OrderDocument({ order, kind, onClose }: { order: AdminOrder; kind: DocKind; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const title = kind === "invoice" ? `Facture ${order.invoiceNumber ?? order.number}` : `Bordereau ${order.number}`;

  return createPortal(
    <div id="print-root" role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[70] overflow-y-auto bg-raised">
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3">
        <p className="truncate font-medium">{title}</p>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="size-4" /> Imprimer / PDF
          </Button>
          <button onClick={onClose} aria-label="Fermer" className="grid size-10 place-items-center rounded-md hover:bg-raised">
            <X className="size-5" />
          </button>
        </div>
      </div>
      <div className="px-3 py-6 md:py-10">
        <article className="paper mx-auto w-full max-w-[210mm] bg-white p-[6vw] text-[13px] leading-snug text-black shadow-xl shadow-black/20 sm:p-[14mm]">
          {kind === "invoice" ? <Invoice order={order} /> : <Slip order={order} />}
        </article>
      </div>
    </div>,
    document.body,
  );
}

/** Eliott SNKRS et ses coordonnées (data/legal.ts) */
function Seller({ compact }: { compact?: boolean }) {
  return (
    <div className="grid gap-0.5">
      <p className="font-bold">{LEGAL.brand}</p>
      {!compact && <Fill value={LEGAL.ownerName} label="nom ou raison sociale" />}
      <Fill value={LEGAL.address} label="adresse" />
      {!compact && (
        <>
          <p>
            SIRET <Fill value={LEGAL.siret} label="n° SIRET" />
          </p>
          <Fill value={LEGAL.email} label="e-mail" />
        </>
      )}
    </div>
  );
}

function Head({ title, children }: { title: string; children: ReactNode }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-black pb-5">
      <div className="flex items-start gap-3">
        <LogoMark className="size-11 shrink-0 text-black" />
        <Seller />
      </div>
      <div className="sm:text-right">
        <h1 className="text-2xl font-extrabold uppercase tracking-tight">{title}</h1>
        <div className="mt-2 grid gap-0.5">{children}</div>
      </div>
    </header>
  );
}

function Invoice({ order: o }: { order: AdminOrder }) {
  const date = o.paidAt ?? o.createdAt;
  return (
    <>
      <Head title="Facture">
        <p>
          N° <Fill value={o.invoiceNumber} label="numéro (relancer supabase/payments.sql)" className="font-bold" />
        </p>
        <p>Date : {longDate(date)}</p>
        <p>Commande : {o.number}</p>
      </Head>

      <section className="mt-6">
        <p className="text-[11px] font-bold uppercase tracking-wider text-black/60">Facturé à</p>
        <p className="mt-1 font-bold">{o.customer.name}</p>
        <p>{o.customer.street}</p>
        <p>{o.customer.cityLine}</p>
        <p>{o.customer.email}</p>
      </section>

      <table className="mt-6 w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-black text-[11px] uppercase tracking-wider">
            <th className="py-2 pr-2 font-bold">Désignation</th>
            <th className="py-2 pr-2 text-center font-bold">Qté</th>
            <th className="py-2 pr-2 text-right font-bold">Prix unit.</th>
            <th className="py-2 text-right font-bold">Total</th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((i) => (
            <tr key={`${i.slug}|${i.size}|${i.condition ?? ""}`} className="border-b border-black/15 align-top">
              <td className="py-2.5 pr-2">
                <p className="font-bold">{i.name}</p>
                <p className="text-black/70">
                  {[i.colorway, sizeText(i.size), i.condition && conditionCodeLabel(i.condition)].filter(Boolean).join(" · ")}
                </p>
              </td>
              <td className="py-2.5 pr-2 text-center tabular-nums">{i.qty}</td>
              <td className="py-2.5 pr-2 text-right tabular-nums">{formatPrice(i.price)}</td>
              <td className="py-2.5 text-right tabular-nums">{formatPrice(i.price * i.qty)}</td>
            </tr>
          ))}
          <tr className="border-b border-black/15">
            <td className="py-2.5 pr-2">Livraison · {shippingText(o.shippingLabel)}</td>
            <td className="py-2.5 pr-2 text-center tabular-nums">1</td>
            <td className="py-2.5 pr-2 text-right tabular-nums">{formatPrice(o.shippingPrice)}</td>
            <td className="py-2.5 text-right tabular-nums">{formatPrice(o.shippingPrice)}</td>
          </tr>
        </tbody>
      </table>

      <div className="ml-auto mt-4 grid w-full max-w-[260px] gap-1">
        <p className="flex justify-between">
          <span>Sous-total</span>
          <span className="tabular-nums">{formatPrice(o.subtotal)}</span>
        </p>
        <p className="flex justify-between">
          <span>Livraison</span>
          <span className="tabular-nums">{formatPrice(o.shippingPrice)}</span>
        </p>
        <p className="mt-1 flex justify-between border-t-2 border-black pt-2 text-base font-extrabold">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(o.total)}</span>
        </p>
      </div>

      <section className="mt-8 grid gap-1 text-black/80">
        {LEGAL.vatExempt ? (
          <p className="font-bold text-black">TVA non applicable, art. 293 B du CGI.</p>
        ) : (
          <p>
            N° TVA intracommunautaire : <Fill value={LEGAL.vatNumber} label="n° de TVA" />
          </p>
        )}
        <p>
          Payée le {longDate(date)} par {o.provider === "PayPal" ? "PayPal" : "carte bancaire"}.
        </p>
      </section>

      <footer className="mt-10 border-t border-black/20 pt-3 text-[11px] text-black/60">
        {LEGAL.brand}
        {LEGAL.legalForm && ` · ${LEGAL.legalForm}`}
        {LEGAL.siret && ` · SIRET ${LEGAL.siret}`}
        {LEGAL.rcs && ` · ${LEGAL.rcs}`}
        {` · instagram.com/${SITE.instagram}`}
      </footer>
    </>
  );
}

function Slip({ order: o }: { order: AdminOrder }) {
  return (
    <>
      {/* l'étiquette : à découper et coller sur le colis */}
      <p className="flex items-center gap-1.5 text-[11px] text-black/60">
        <Scissors className="size-3.5" /> À découper et coller sur le colis
      </p>
      <section className="mt-2 rounded-sm border-2 border-dashed border-black p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/30 pb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-black/60">Expéditeur</p>
            <Seller compact />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-black/60">Envoi</p>
            <p className="font-bold">{shippingText(o.shippingLabel)}</p>
            <p className="font-mono">{o.number}</p>
          </div>
        </div>
        <div className="pt-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-black/60">Destinataire</p>
          <p className="mt-1 text-2xl font-extrabold uppercase leading-tight">{o.customer.name}</p>
          <p className="text-xl leading-snug">{o.customer.street}</p>
          <p className="text-xl font-bold uppercase leading-snug">{o.customer.cityLine}</p>
          {o.customer.phone && <p className="mt-1 text-base">Tél. {o.customer.phone}</p>}
        </div>
      </section>

      {/* le bon de livraison : à glisser dans le colis */}
      <div className="my-8 border-t border-dashed border-black/40" />
      <Head title="Bon de livraison">
        <p>Commande : {o.number}</p>
        <p>Date : {longDate(o.paidAt ?? o.createdAt)}</p>
        <p>{shippingText(o.shippingLabel)}</p>
      </Head>

      <section className="mt-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-black/60">Livré à</p>
        <p className="mt-1 font-bold">{o.customer.name}</p>
        <p>
          {o.customer.street}, {o.customer.cityLine}
        </p>
      </section>

      <table className="mt-5 w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-black text-[11px] uppercase tracking-wider">
            <th className="w-8 py-2 font-bold" aria-label="Préparé" />
            <th className="py-2 pr-2 font-bold">Article</th>
            <th className="py-2 pr-2 font-bold">Pointure</th>
            <th className="py-2 pr-2 font-bold">État</th>
            <th className="py-2 text-center font-bold">Qté</th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((i) => (
            <tr key={`${i.slug}|${i.size}|${i.condition ?? ""}`} className="border-b border-black/15 align-top">
              <td className="py-2.5">
                <span className="block size-4 border-2 border-black" />
              </td>
              <td className="py-2.5 pr-2">
                <p className="font-bold">{i.name}</p>
                {i.colorway && <p className="text-black/70">{i.colorway}</p>}
              </td>
              <td className="py-2.5 pr-2">{sizeText(i.size)}</td>
              <td className="py-2.5 pr-2">{i.condition ? conditionCodeLabel(i.condition) : "—"}</td>
              <td className="py-2.5 text-center tabular-nums">{i.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-8 font-bold">Merci pour ta commande !</p>
      <p className="mt-1 text-black/70">
        Une question ou un souci ? Écris-nous sur Instagram @{SITE.instagram}
        {LEGAL.email && ` ou à ${LEGAL.email}`}.
      </p>
    </>
  );
}
