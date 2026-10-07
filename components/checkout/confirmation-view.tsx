"use client";

import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { SHIPPING, SITE } from "@/data/site";
import { sizeText } from "@/data/taxonomy";
import { useCart } from "@/lib/cart";
import { useCatalog } from "@/lib/catalog/provider";
import { confirmOrder, PAYMENTS_LIVE, PaymentError, type PublicOrder } from "@/lib/payment";
import { findProduct } from "@/lib/products";

import { cartSummaryLines, OrderSummary, type SummaryLine } from "./order-summary";
import { forgetPendingOrder } from "./pending-order";

export function ConfirmationView() {
  const id = useSearchParams().get("commande");
  return PAYMENTS_LIVE && id ? <LiveConfirmation id={id} /> : <DemoConfirmation />;
}

/** Maquette : la commande simulée gardée dans le navigateur. */
function DemoConfirmation() {
  const { lastOrder: order, ready } = useCart();

  if (!ready) return <div className="h-[60vh]" />;
  if (!order) {
    return (
      <Message title="Aucune commande récente">
        <Link href="/catalogue" className={buttonVariants({ className: "mt-8" })}>
          Voir le stock
        </Link>
      </Message>
    );
  }
  return (
    <ThankYou
      number={order.number}
      firstName={order.name.split(" ")[0]}
      email={order.email}
      shippingLabel={order.shipping.label}
      address={order.address}
      lines={cartSummaryLines(order.lines)}
      subtotal={order.subtotal}
      shipping={order.shipping.price}
    />
  );
}

type State =
  | { kind: "loading" }
  | { kind: "done"; order: PublicOrder; notice?: "declined" | "expired" }
  | { kind: "error"; message: string };

/** Retour de Stripe / PayPal : on demande au serveur où en est le paiement. */
function LiveConfirmation({ id }: { id: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const { clear } = useCart();
  const { products } = useCatalog();

  useEffect(() => {
    let alive = true;
    confirmOrder(id).then(
      ({ order, notice }) => {
        if (!alive) return;
        // Stripe peut confirmer quelques secondes après le retour : on revérifie
        if (order.status === "pending" && order.provider === "stripe" && attempt < 4) {
          window.setTimeout(() => alive && setAttempt((n) => n + 1), 2000);
          return;
        }
        setState({ kind: "done", order, notice });
      },
      (e) =>
        alive &&
        setState({
          kind: "error",
          message: e instanceof PaymentError ? e.message : "Impossible de vérifier le paiement.",
        }),
    );
    return () => {
      alive = false;
    };
  }, [id, attempt]);

  const paid = state.kind === "done" && (state.order.status === "paid" || state.order.status === "shipped");
  useEffect(() => {
    if (!paid) return;
    clear();
    forgetPendingOrder(id, true);
  }, [paid, clear, id]);

  if (state.kind === "loading") {
    return (
      <Message title="Vérification du paiement…">
        <Loader2 className="mx-auto mt-8 size-8 animate-spin text-acc-ink" aria-hidden />
        <p className="mt-6 text-muted">Ne ferme pas cette page, ça ne prend que quelques secondes.</p>
      </Message>
    );
  }

  if (state.kind === "error") {
    return (
      <Message title="Vérification impossible">
        <p className="mt-4 text-muted">{state.message}</p>
        <p className="mt-2 text-muted">
          Si ton compte a été débité, ta commande est bien enregistrée : contacte-nous sur Instagram avec ton e-mail.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setState({ kind: "loading" });
              setAttempt((n) => n + 10);
            }}
            className={buttonVariants()}
          >
            Réessayer
          </button>
          <a href={SITE.instagramDm} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline" })}>
            Écrire à @{SITE.instagram}
          </a>
        </div>
      </Message>
    );
  }

  const { order, notice } = state;
  if (!paid) {
    const title =
      order.status === "cancelled"
        ? "Réservation expirée"
        : notice === "declined"
          ? "Paiement refusé"
          : "Paiement non finalisé";
    const text =
      order.status === "cancelled"
        ? "Le délai de 30 minutes pour payer est dépassé et les articles ont été remis en vente. Aucun montant n'a été débité."
        : notice === "declined"
          ? "Le paiement a été refusé. Aucun montant n'a été débité : tu peux réessayer avec un autre moyen de paiement."
          : "Nous n'avons pas encore reçu la confirmation du paiement. Si tu n'as pas validé le paiement, tu peux reprendre ta commande.";
    return (
      <Message title={title}>
        <p className="mt-4 text-muted">{text}</p>
        <Link href="/checkout" className={buttonVariants({ className: "mt-8" })}>
          Reprendre ma commande
        </Link>
      </Message>
    );
  }

  const lines: SummaryLine[] = order.items.map((i) => ({
    key: i.slug + i.size,
    name: i.name,
    detail: [i.colorway, sizeText(i.size)].filter(Boolean).join(" · "),
    qty: i.qty,
    total: i.price * i.qty,
    product: findProduct(products, i.slug),
  }));
  return (
    <ThankYou
      number={order.number}
      firstName={order.firstName}
      email={order.email}
      shippingLabel={SHIPPING.find((s) => s.id === order.shippingMethod)?.label ?? "Livraison"}
      address={order.address}
      lines={lines}
      subtotal={order.subtotal}
      shipping={order.shippingPrice}
    />
  );
}

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl uppercase">{title}</h1>
      {children}
    </div>
  );
}

function ThankYou(o: {
  number: string;
  firstName: string;
  email: string;
  shippingLabel: string;
  address: string;
  lines: SummaryLine[];
  subtotal: number;
  shipping: number;
}) {
  return (
    <div className="mx-auto grid max-w-[1080px] gap-12 px-4 pb-24 pt-12 md:px-8 md:pt-20 lg:grid-cols-[1fr_400px]">
      <div>
        <span className="grid size-14 place-items-center rounded-full bg-acc text-on-acc">
          <Check className="size-7" strokeWidth={2.5} />
        </span>
        <p className="label mt-8 text-acc-ink">Commande {o.number}</p>
        <h1 className="mt-3 font-display text-5xl font-medium uppercase leading-none tracking-tight md:text-6xl">
          Merci {o.firstName} !
        </h1>
        <p className="mt-6 max-w-md leading-relaxed text-muted">
          Ta commande est confirmée et payée. Eliott vérifie chaque pièce avant l&apos;envoi ; tu recevras le numéro de
          suivi par e-mail à <span className="text-ink">{o.email}</span>.
        </p>

        <ol className="mt-10 grid gap-0 border-l border-line pl-6">
          {[
            ["Commande reçue", "À l'instant"],
            ["Authentification et emballage", "Sous 24 h"],
            [`Expédition · ${o.shippingLabel}`, "Sous 48 h"],
          ].map(([t, d], i) => (
            <li key={t} className="relative pb-6">
              <span
                className={`absolute -left-[29px] top-1 size-2.5 rounded-full ${i === 0 ? "bg-acc" : "border border-dim bg-ground"}`}
              />
              <p className="text-[15px]">{t}</p>
              <p className="text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/catalogue" className={buttonVariants()}>
            Continuer mes achats
          </Link>
          <a href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline" })}>
            Suivre @{SITE.instagram}
          </a>
        </div>
      </div>

      <aside className="h-fit rounded-md border border-line bg-surface p-6">
        <h2 className="label mb-2 text-ink">Livraison</h2>
        <p className="mb-6 text-sm text-muted">{o.address}</p>
        <OrderSummary lines={o.lines} subtotal={o.subtotal} shipping={o.shipping} />
      </aside>
    </div>
  );
}
