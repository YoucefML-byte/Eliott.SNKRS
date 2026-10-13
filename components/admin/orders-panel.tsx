"use client";

import { Check, FileText, Mail, Package, Tag, Undo2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { sizeText } from "@/data/taxonomy";
import { formatPrice } from "@/lib/format";
import { conditionCodeLabel } from "@/lib/products";
import { listOrders, markShipped, type AdminOrder, type ShipEmail } from "@/lib/orders";
import { cn } from "@/lib/utils";

import { OrderDocument, type DocKind } from "./order-documents";

const date = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Commandes payées : ce qu'il faut expédier, puis l'historique. */
export function OrdersPanel() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listOrders().then(
      (list) => alive && setOrders(list),
      (e) => alive && setError(e instanceof Error ? e.message : "Impossible de charger les commandes."),
    );
    return () => {
      alive = false;
    };
  }, []);

  const update = (id: string, patch: Partial<AdminOrder>) =>
    setOrders((list) => list?.map((o) => (o.id === id ? { ...o, ...patch } : o)) ?? null);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!orders) return <div className="h-40 animate-pulse rounded-md bg-surface" />;
  if (orders.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-line px-6 py-16 text-center">
        <p className="font-display text-2xl uppercase">Aucune commande pour l&apos;instant</p>
        <p className="mt-3 text-muted">Les commandes payées apparaîtront ici, avec l&apos;adresse de livraison.</p>
      </div>
    );
  }

  const toShip = orders.filter((o) => o.status === "paid");
  return (
    <div className="grid gap-4">
      <p className="font-mono text-sm text-muted">
        {toShip.length} à expédier · {orders.length - toShip.length} expédiée{orders.length - toShip.length > 1 ? "s" : ""}
      </p>
      <ul className="grid gap-3">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} onChange={update} />
        ))}
      </ul>
    </div>
  );
}

/** ce que l'admin voit après « Confirmer l'expédition » */
const EMAIL_NOTICE: Record<ShipEmail, { text: (email: string) => string; warn?: boolean }> = {
  sent: { text: (email) => `E-mail « Ta commande est en route » envoyé à ${email}.` },
  already_sent: { text: () => "L'e-mail d'expédition avait déjà été envoyé." },
  demo: { text: () => "Mode démo : aucun e-mail n'est envoyé." },
  not_configured: {
    text: () => "Expédiée, mais aucun e-mail n'est parti : l'envoi d'e-mails (Brevo) n'est pas encore configuré.",
    warn: true,
  },
  failed: {
    text: () => "Expédiée, mais l'e-mail n'a pas pu partir. Réessaie avec « Envoyer l'e-mail ».",
    warn: true,
  },
};

function OrderCard({
  order: o,
  onChange,
}: {
  order: AdminOrder;
  onChange: (id: string, patch: Partial<AdminOrder>) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<ShipEmail | null>(null);
  const [form, setForm] = useState(false);
  const [tracking, setTracking] = useState("");
  const [doc, setDoc] = useState<DocKind | null>(null);
  const shipped = o.status === "shipped";

  const ship = async (next: boolean) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const r = await markShipped(o.id, next, next ? tracking : "");
      onChange(o.id, {
        status: next ? "shipped" : "paid",
        trackingNumber: r.trackingNumber,
        ...(r.email === "sent" ? { shippedEmailAt: new Date().toISOString() } : {}),
      });
      if (r.email) setNotice(r.email);
      setForm(false);
      setTracking("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mise à jour impossible.");
    }
    setBusy(false);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    ship(true);
  };
  // expédiée sans e-mail parti (Brevo en panne, ou configuré après coup)
  const canResend = shipped && !o.shippedEmailAt && notice !== "demo" && notice !== "already_sent";

  return (
    <li className={cn("rounded-md border p-4 md:p-5", shipped ? "border-line" : "border-acc/60 bg-acc/5")}>
      <div className={cn(shipped && "opacity-70")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-sm">
              {o.number} <span className="text-muted">· {date(o.createdAt)} · {o.provider}</span>
            </p>
            {o.invoiceNumber && <p className="font-mono text-xs text-muted">Facture {o.invoiceNumber}</p>}
            <p className="mt-1 font-medium">{o.customer.name}</p>
          </div>
          <span className="font-mono tabular-nums">{formatPrice(o.total)}</span>
        </div>

        <ul className="mt-3 grid gap-1 text-sm">
          {o.items.map((i) => (
            <li key={`${i.slug}|${i.size}|${i.condition ?? ""}`}>
              {i.qty > 1 && `${i.qty} × `}
              {i.name} · <span className="font-mono">{sizeText(i.size)}</span>
              {i.condition && <span className="text-muted"> · {conditionCodeLabel(i.condition)}</span>}
            </li>
          ))}
        </ul>

        <div className="mt-3 grid gap-0.5 text-sm text-muted">
          <p>
            {o.shippingLabel} — {o.customer.address}
          </p>
          <p>
            <a href={`mailto:${o.customer.email}`} className="hover:text-ink">
              {o.customer.email}
            </a>
            {o.customer.phone && (
              <>
                {" · "}
                <a href={`tel:${o.customer.phone.replace(/\s/g, "")}`} className="hover:text-ink">
                  {o.customer.phone}
                </a>
              </>
            )}
          </p>
        </div>
      </div>

      {form && !shipped ? (
        <form onSubmit={submit} className="mt-4 grid gap-2 rounded-md border border-line bg-surface p-3 sm:max-w-md">
          <label htmlFor={`suivi-${o.id}`} className="text-sm font-medium">
            Numéro de suivi <span className="text-muted">(facultatif)</span>
          </label>
          <input
            id={`suivi-${o.id}`}
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="ex. 6A12345678901"
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={40}
            className="h-11 rounded-md border border-line bg-ground px-3 font-mono text-sm outline-none focus:border-ink"
          />
          <p className="text-xs text-muted">
            {o.customer.name.split(" ")[0]} recevra un e-mail : sa commande est en route
            {tracking.trim() ? ", avec le lien pour suivre le colis" : ""}.
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            <Button size="sm" type="submit" disabled={busy}>
              <Package className="size-4" /> {busy ? "…" : "Confirmer l'expédition"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setForm(false)} disabled={busy}>
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {shipped ? (
            <>
              <span className="flex items-center gap-1.5 text-sm text-acc-ink">
                <Check className="size-4" /> Expédiée
                {o.trackingNumber && <span className="font-mono text-muted">· Suivi {o.trackingNumber}</span>}
              </span>
              {canResend && (
                <Button size="sm" onClick={() => ship(true)} disabled={busy}>
                  <Mail className="size-4" /> {busy ? "…" : "Envoyer l'e-mail"}
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => ship(false)} disabled={busy} title="Remettre « à expédier »">
                <Undo2 className="size-4" /> Annuler
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setForm(true)}>
              <Package className="size-4" /> Marquer expédiée
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setDoc("slip")}>
            <Tag className="size-4" /> Bordereau
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDoc("invoice")}>
            <FileText className="size-4" /> Facture
          </Button>
        </div>
      )}
      {shipped && o.shippedEmailAt && !notice && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          <Mail className="size-3.5" /> E-mail d&apos;expédition envoyé le {date(o.shippedEmailAt)}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className={cn("mt-2 text-sm", EMAIL_NOTICE[notice].warn ? "font-medium text-[#7a3a00]" : "text-acc-ink")}
        >
          {EMAIL_NOTICE[notice].text(o.customer.email)}
        </p>
      )}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      {doc && <OrderDocument order={o} kind={doc} onClose={() => setDoc(null)} />}
    </li>
  );
}
