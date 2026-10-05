"use client";

import { ChevronDown, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { SHIPPING, SITE, type ShippingId } from "@/data/site";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Field } from "./field";
import { OrderSummary } from "./order-summary";

const DEMO: Record<string, string> = {
  email: "client@exemple.fr",
  phone: "06 12 34 56 78",
  firstName: "Camille",
  lastName: "Martin",
  address: "12 rue Oberkampf",
  zip: "75011",
  city: "Paris",
  card: "4242 4242 4242 4242",
  expiry: "12/28",
  cvc: "123",
  cardName: "Camille Martin",
};

const PAYMENTS = ["Carte", "Apple Pay", "PayPal"] as const;

export function CheckoutView() {
  const cart = useCart();
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [shippingId, setShippingId] = useState<ShippingId>("colissimo");
  const [payment, setPayment] = useState<(typeof PAYMENTS)[number]>("Carte");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [placing, setPlacing] = useState(false);

  const free = cart.subtotal >= SITE.freeShippingFrom;
  const priceOf = (id: ShippingId) => {
    const s = SHIPPING.find((x) => x.id === id)!;
    return free && id !== "express" ? 0 : s.price;
  };
  const shipping = priceOf(shippingId);

  const fillDemo = () => {
    const f = form.current;
    if (!f) return;
    for (const [k, v] of Object.entries(DEMO)) {
      const el = f.elements.namedItem(k);
      if (el instanceof HTMLInputElement) el.value = v;
    }
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "");
    setPlacing(true);
    // fake payment latency
    window.setTimeout(() => {
      cart.placeOrder({
        email: get("email"),
        name: `${get("firstName")} ${get("lastName")}`,
        address: `${get("address")}, ${get("zip")} ${get("city")}`,
        shipping: { label: SHIPPING.find((s) => s.id === shippingId)!.label, price: shipping },
      });
      router.push("/checkout/confirmation");
    }, 900);
  };

  if (cart.ready && cart.lines.length === 0 && !placing) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl uppercase">Aucune paire à commander</h1>
        <p className="mt-4 text-muted">Ajoute une paire au panier pour passer commande.</p>
        <Link href="/catalogue" className={buttonVariants({ className: "mt-8" })}>
          Voir le stock
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-24 pt-8 md:px-8 md:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-medium uppercase tracking-tight md:text-6xl">Commande</h1>
        <p className="flex items-center gap-2 text-sm text-muted">
          <Lock className="size-4 text-acc-ink" /> Paiement sécurisé
        </p>
      </div>
      <p className="mt-4 rounded-md border border-warm/50 bg-warm/10 px-4 py-3 text-sm text-ink">
        Maquette : aucune commande n&apos;est réellement passée et aucun paiement n&apos;est débité.{" "}
        <button type="button" onClick={fillDemo} className="underline underline-offset-4 hover:text-acc-ink">
          Remplir avec un exemple
        </button>
      </p>

      {/* mobile summary */}
      <div className="mt-6 rounded-md border border-line lg:hidden">
        <button
          type="button"
          onClick={() => setSummaryOpen((o) => !o)}
          aria-expanded={summaryOpen}
          className="flex w-full items-center justify-between px-4 py-4 text-sm"
        >
          <span className="flex items-center gap-2">
            Récapitulatif ({cart.count})
            <ChevronDown className={cn("size-4 transition-transform", summaryOpen && "rotate-180")} />
          </span>
          <span className="font-mono tabular-nums">{formatPrice(cart.subtotal + shipping)}</span>
        </button>
        {summaryOpen && (
          <div className="border-t border-line p-4">
            <OrderSummary lines={cart.lines} subtotal={cart.subtotal} shipping={shipping} />
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_400px] lg:gap-16">
        <form ref={form} onSubmit={submit} className="grid gap-12">
          <Step n={1} title="Contact">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="email" label="E-mail" type="email" autoComplete="email" required />
              <Field id="phone" label="Téléphone" type="tel" autoComplete="tel" required />
            </div>
          </Step>

          <Step n={2} title="Livraison">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="firstName" label="Prénom" autoComplete="given-name" required />
              <Field id="lastName" label="Nom" autoComplete="family-name" required />
              <Field id="address" label="Adresse" autoComplete="street-address" required className="sm:col-span-2" />
              <Field id="zip" label="Code postal" autoComplete="postal-code" inputMode="numeric" required />
              <Field id="city" label="Ville" autoComplete="address-level2" required />
            </div>
            <fieldset className="mt-6 grid gap-2">
              <legend className="sr-only">Mode de livraison</legend>
              {SHIPPING.map((s) => (
                <label
                  key={s.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-4 rounded-md border px-4 py-4 transition-colors",
                    shippingId === s.id ? "border-acc bg-acc/5" : "border-line hover:border-dim",
                  )}
                >
                  <input
                    type="radio"
                    name="shipping"
                    value={s.id}
                    checked={shippingId === s.id}
                    onChange={() => setShippingId(s.id)}
                    className="size-4 accent-[var(--acc)]"
                  />
                  <span className="flex-1">
                    <span className="block text-[15px]">{s.label}</span>
                    <span className="block text-sm text-muted">{s.detail}</span>
                  </span>
                  <span className="font-mono text-sm tabular-nums">
                    {priceOf(s.id) === 0 ? "Offerte" : formatPrice(priceOf(s.id))}
                  </span>
                </label>
              ))}
            </fieldset>
          </Step>

          <Step n={3} title="Paiement">
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Moyen de paiement">
              {PAYMENTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={payment === p}
                  onClick={() => setPayment(p)}
                  className={cn(
                    "h-12 rounded-md border text-sm transition-colors",
                    payment === p ? "border-acc bg-acc/5 text-ink" : "border-line text-muted hover:border-dim",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            {payment === "Carte" ? (
              <div className="mt-5 grid grid-cols-2 gap-4">
                <Field id="card" label="Numéro de carte" inputMode="numeric" autoComplete="cc-number" placeholder="1234 1234 1234 1234" required className="col-span-2" />
                <Field id="expiry" label="Expiration" placeholder="MM/AA" autoComplete="cc-exp" required />
                <Field id="cvc" label="CVC" inputMode="numeric" autoComplete="cc-csc" placeholder="123" required />
                <Field id="cardName" label="Titulaire" autoComplete="cc-name" required className="col-span-2" />
              </div>
            ) : (
              <p className="mt-5 rounded-md border border-line bg-surface px-4 py-5 text-sm text-muted">
                Tu seras redirigé vers {payment} pour valider le paiement (simulé dans la maquette).
              </p>
            )}
          </Step>

          <div>
            <Button type="submit" size="lg" className="w-full" disabled={placing}>
              {placing ? "Paiement en cours…" : `Payer ${formatPrice(cart.subtotal + shipping)}`}
            </Button>
            <p className="mt-3 text-center text-xs text-dim">
              En validant, tu acceptes les conditions de vente d&apos;Eliott SNKRS.
            </p>
          </div>
        </form>

        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-md border border-line bg-surface p-6">
            <h2 className="label mb-6 text-ink">Récapitulatif</h2>
            <OrderSummary lines={cart.lines} subtotal={cart.subtotal} shipping={shipping} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-5 flex items-baseline gap-3 font-display text-2xl font-medium uppercase tracking-tight">
        <span className="font-mono text-sm text-acc-ink">0{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
