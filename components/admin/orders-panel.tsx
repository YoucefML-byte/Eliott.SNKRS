"use client";

import { Check, Package, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { sizeText } from "@/data/taxonomy";
import { formatPrice } from "@/lib/format";
import { listOrders, markShipped, type AdminOrder } from "@/lib/orders";
import { cn } from "@/lib/utils";

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

  const update = (id: string, shipped: boolean) =>
    setOrders((list) => list?.map((o) => (o.id === id ? { ...o, status: shipped ? "shipped" : "paid" } : o)) ?? null);

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

function OrderCard({ order: o, onChange }: { order: AdminOrder; onChange: (id: string, shipped: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shipped = o.status === "shipped";

  const toggle = async () => {
    setBusy(true);
    setError(null);
    try {
      await markShipped(o.id, !shipped);
      onChange(o.id, !shipped);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mise à jour impossible.");
    }
    setBusy(false);
  };

  return (
    <li className={cn("rounded-md border p-4 md:p-5", shipped ? "border-line opacity-70" : "border-acc/60 bg-acc/5")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm">
            {o.number} <span className="text-muted">· {date(o.createdAt)} · {o.provider}</span>
          </p>
          <p className="mt-1 font-medium">{o.customer.name}</p>
        </div>
        <span className="font-mono tabular-nums">{formatPrice(o.total)}</span>
      </div>

      <ul className="mt-3 grid gap-1 text-sm">
        {o.items.map((i) => (
          <li key={i.slug + i.size}>
            {i.qty > 1 && `${i.qty} × `}
            {i.name} · <span className="font-mono">{sizeText(i.size)}</span>
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

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {shipped ? (
          <>
            <span className="flex items-center gap-1.5 text-sm text-acc-ink">
              <Check className="size-4" /> Expédiée
            </span>
            <Button size="sm" variant="outline" onClick={toggle} disabled={busy}>
              <Undo2 className="size-4" /> Annuler
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={toggle} disabled={busy}>
            <Package className="size-4" /> {busy ? "…" : "Marquer expédiée"}
          </Button>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </li>
  );
}
