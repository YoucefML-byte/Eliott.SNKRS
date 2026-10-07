"use client";

import { ChevronDown, CreditCard, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { SHIPPING, SITE, type ShippingId } from "@/data/site";
import { useCart } from "@/lib/cart";
import { useCatalog } from "@/lib/catalog/provider";
import { formatPrice } from "@/lib/format";
import { cancelOrder, PAYMENTS_LIVE, PaymentError, startCheckout, type Provider } from "@/lib/payment";
import { cn } from "@/lib/utils";

import { Field } from "./field";
import { cartSummaryLines, OrderSummary } from "./order-summary";
import { forgetPendingOrder, pendingOrder, rememberPendingOrder, saveDetails, savedDetails } from "./pending-order";

const DEMO: Record<string, string> = {
  email: "client@exemple.fr",
  phone: "06 12 34 56 78",
  firstName: "Camille",
  lastName: "Martin",
  address: "12 rue Oberkampf",
  zip: "75011",
  city: "Paris",
};

const PAYMENTS: { id: Provider; label: string; detail: string }[] = [
  { id: "stripe", label: "Carte bancaire", detail: "CB, Visa, Mastercard · Apple Pay · Google Pay" },
  { id: "paypal", label: "PayPal", detail: "Avec ton compte PayPal, sans ressaisir ta carte" },
];

export function CheckoutView() {
  const cart = useCart();
  const catalog = useCatalog();
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [shippingId, setShippingId] = useState<ShippingId>("colissimo");
  const [payment, setPayment] = useState<Provider>("stripe");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // coordonnées déjà saisies dans cet onglet (retour depuis Stripe / PayPal),
  // remises une seule fois quand le formulaire apparaît
  const prefilled = useRef(false);
  useEffect(() => {
    const f = form.current;
    if (prefilled.current || !f) return;
    prefilled.current = true;
    for (const [k, v] of Object.entries(savedDetails() ?? {})) {
      const el = f.elements.namedItem(k);
      if (el instanceof HTMLInputElement && !el.value) el.value = v;
    }
  });

  // retour depuis Stripe / PayPal sans payer (?annulee=<commande>) : on remet
  // les paires en vente tout de suite plutôt qu'au bout des 30 minutes
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("annulee");
    if (!id || !PAYMENTS_LIVE) return;
    forgetPendingOrder(id);
    cancelOrder(id)
      .catch(() => {})
      .finally(() => {
        setNotice("Paiement annulé : aucun montant n'a été débité. Ton panier t'attend.");
        router.replace("/checkout");
      });
  }, [router]);

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
    const cgv = f.elements.namedItem("cgv");
    if (cgv instanceof HTMLInputElement) cgv.checked = true;
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();
    setPlacing(true);
    setError(null);

    if (!PAYMENTS_LIVE) {
      // maquette : paiement simulé
      window.setTimeout(() => {
        cart.placeOrder({
          email: get("email"),
          phone: get("phone"),
          name: `${get("firstName")} ${get("lastName")}`,
          address: `${get("address")}, ${get("zip")} ${get("city")}`,
          shipping: { label: SHIPPING.find((s) => s.id === shippingId)!.label, price: shipping },
          payment: PAYMENTS.find((p) => p.id === payment)!.label,
        });
        router.push("/checkout/confirmation");
      }, 900);
      return;
    }

    const customer = {
      email: get("email"),
      phone: get("phone"),
      firstName: get("firstName"),
      lastName: get("lastName"),
      address: get("address"),
      zip: get("zip"),
      city: get("city"),
    };
    saveDetails(customer);

    try {
      // une tentative précédente abandonnée (bouton retour) bloque encore ses paires
      const previous = pendingOrder();
      if (previous) await cancelOrder(previous).catch(() => {});
      const { order, url } = await startCheckout({
        items: cart.lines.map(({ slug, size, qty }) => ({ slug, size, qty })),
        customer,
        shipping: shippingId,
        provider: payment,
      });
      rememberPendingOrder(order.id);
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof PaymentError ? err.message : "Le paiement n'a pas pu démarrer. Réessaie.");
      setPlacing(false);
    }
  };

  const loading = !cart.ready || (catalog.mode === "supabase" && !catalog.ready);
  if (loading) return <div className="h-[60vh]" />;

  if (catalog.admin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl uppercase">Mode admin</h1>
        <p className="mt-4 text-muted">
          Les commandes sont désactivées en mode admin. Quitte le mode admin pour tester un achat.
        </p>
        <Link href="/admin" className={buttonVariants({ className: "mt-8" })}>
          Espace admin
        </Link>
      </div>
    );
  }

  if (cart.lines.length === 0 && !placing) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl uppercase">Aucun article à commander</h1>
        <p className="mt-4 text-muted">Ajoute un article au panier pour passer commande.</p>
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
      {!PAYMENTS_LIVE && (
        <p className="mt-4 rounded-md border border-warm/50 bg-warm/10 px-4 py-3 text-sm text-ink">
          Maquette : aucune commande n&apos;est réellement passée et aucun paiement n&apos;est débité.{" "}
          <button type="button" onClick={fillDemo} className="underline underline-offset-4 hover:text-acc-ink">
            Remplir avec un exemple
          </button>
        </p>
      )}
      {notice && (
        <p role="status" className="mt-4 rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink">
          {notice}
        </p>
      )}

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
            <OrderSummary lines={cartSummaryLines(cart.lines)} subtotal={cart.subtotal} shipping={shipping} />
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
            <fieldset className="grid gap-2">
              <legend className="sr-only">Moyen de paiement</legend>
              {PAYMENTS.map((p) => (
                <label
                  key={p.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-4 rounded-md border px-4 py-4 transition-colors",
                    payment === p.id ? "border-acc bg-acc/5" : "border-line hover:border-dim",
                  )}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={p.id}
                    checked={payment === p.id}
                    onChange={() => setPayment(p.id)}
                    className="size-4 accent-[var(--acc)]"
                  />
                  <span className="flex-1">
                    <span className="block text-[15px]">{p.label}</span>
                    <span className="block text-sm text-muted">{p.detail}</span>
                  </span>
                  {p.id === "stripe" ? (
                    <CreditCard className="size-5 text-muted" />
                  ) : (
                    <span className="font-display text-sm font-semibold italic text-[#003087]">PayPal</span>
                  )}
                </label>
              ))}
            </fieldset>
            <p className="mt-4 flex items-start gap-2 text-sm text-muted">
              <Lock className="mt-0.5 size-4 shrink-0 text-acc-ink" />
              {payment === "stripe"
                ? "Tu seras redirigé vers la page de paiement sécurisée Stripe. Tes données bancaires ne passent jamais par notre site."
                : "Tu seras redirigé vers PayPal pour valider le paiement, puis ramené ici."}
              {!PAYMENTS_LIVE && " (Simulé dans la maquette.)"}
            </p>
          </Step>

          <div>
            <label htmlFor="cgv" className="mb-4 flex cursor-pointer items-start gap-3 text-sm text-muted">
              <input id="cgv" name="cgv" type="checkbox" required className="mt-0.5 size-4 shrink-0 accent-[var(--acc)]" />
              <span>
                J&apos;ai lu et j&apos;accepte les{" "}
                <Link href="/cgv" target="_blank" className="text-ink underline underline-offset-4">
                  conditions générales de vente
                </Link>
                , dont le droit de rétractation de 14 jours.
              </span>
            </label>
            {error && (
              <p role="alert" className="mb-4 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={placing}>
              {placing
                ? PAYMENTS_LIVE
                  ? "Redirection vers le paiement…"
                  : "Paiement en cours…"
                : `Payer ${formatPrice(cart.subtotal + shipping)}${payment === "paypal" ? " avec PayPal" : ""}`}
            </Button>
            <p className="mt-3 text-center text-xs leading-relaxed text-dim">
              Tes coordonnées servent uniquement à traiter et livrer ta commande ; elles sont transmises au
              transporteur et au prestataire de paiement, jamais revendues. Tu peux y accéder ou les faire
              supprimer à tout moment :{" "}
              <Link href="/confidentialite" className="underline underline-offset-4 hover:text-ink">
                politique de confidentialité
              </Link>
              .
            </p>
          </div>
        </form>

        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-md border border-line bg-surface p-6">
            <h2 className="label mb-6 text-ink">Récapitulatif</h2>
            <OrderSummary lines={cartSummaryLines(cart.lines)} subtotal={cart.subtotal} shipping={shipping} />
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
