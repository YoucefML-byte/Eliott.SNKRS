"use client";

import { LogOut, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import { brandName } from "@/data/brands";
import type { Product } from "@/data/types";
import { DEMO_ADMIN } from "@/lib/catalog/demo";
import { useCatalog } from "@/lib/catalog/provider";
import { formatPrice } from "@/lib/format";
import { inStock, productHref } from "@/lib/products";

export function AdminPage() {
  const { admin } = useCatalog();
  return admin ? <Dashboard /> : <Login />;
}

function DemoNotice() {
  const { mode } = useCatalog();
  if (mode !== "demo") return null;
  return (
    <p className="rounded-md border border-warm/50 bg-warm/10 px-4 py-3 text-sm">
      <strong>Mode démo</strong> : la base de données n&apos;est pas encore branchée. Les paires ajoutées
      ou supprimées ne changent que dans ce navigateur.
    </p>
  );
}

function Login() {
  const { signIn, mode } = useCatalog();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await signIn(String(data.get("email")), String(data.get("password")));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-md gap-6 px-4 py-16 md:py-24">
      <div>
        <p className="label text-acc-ink">Espace admin</p>
        <h1 className="mt-3 font-display text-5xl font-medium uppercase leading-none tracking-tight">Connexion</h1>
        <p className="mt-4 text-muted">Réservé à Eliott pour gérer les paires du site.</p>
      </div>
      <DemoNotice />
      <form onSubmit={submit} className="grid gap-4">
        <label htmlFor="email" className="grid gap-1.5">
          <span className="text-sm text-muted">E-mail</span>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            defaultValue={mode === "demo" ? DEMO_ADMIN.email : undefined}
            className="h-12 rounded-md border border-line bg-surface px-4 text-[15px] outline-none focus:border-acc"
          />
        </label>
        <label htmlFor="password" className="grid gap-1.5">
          <span className="text-sm text-muted">Mot de passe</span>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="h-12 rounded-md border border-line bg-surface px-4 text-[15px] outline-none focus:border-acc"
          />
        </label>
        {mode === "demo" && (
          <p className="text-xs text-dim">
            Démo : mot de passe <span className="font-mono text-ink">{DEMO_ADMIN.password}</span>
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Connexion…" : "Se connecter"}
        </Button>
      </form>
    </div>
  );
}

function Dashboard() {
  const { admin, products, ready, error, setFormOpen, signOut } = useCatalog();

  return (
    <div className="mx-auto grid max-w-[1100px] gap-8 px-4 pb-24 pt-10 md:px-8 md:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-acc-ink">Espace admin · {admin?.email}</p>
          <h1 className="mt-3 font-display text-5xl font-medium uppercase leading-none tracking-tight md:text-6xl">
            Le stock
          </h1>
          <p className="mt-3 font-mono text-sm text-muted">
            {products.length} paire{products.length > 1 ? "s" : ""} en ligne
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="lg" onClick={() => setFormOpen(true)}>
            <Plus className="size-4" /> Ajouter une paire
          </Button>
          <Button size="lg" variant="outline" onClick={signOut}>
            <LogOut className="size-4" /> Déconnexion
          </Button>
        </div>
      </div>

      <DemoNotice />
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!ready ? (
        <div className="h-40 animate-pulse rounded-md bg-surface" />
      ) : products.length === 0 ? (
        <div className="rounded-md border border-dashed border-line px-6 py-16 text-center">
          <p className="font-display text-2xl uppercase">Aucune paire en ligne</p>
          <p className="mt-3 text-muted">Ajoute ta première paire avec le bouton ci-dessus.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {products.map((p) => (
            <AdminRow key={p.slug} product={p} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AdminRow({ product }: { product: Product }) {
  const { removePair } = useCatalog();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sizes = inStock(product).map((s) => s.size);

  const remove = async () => {
    setBusy(true);
    try {
      await removePair(product);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible.");
      setBusy(false);
    }
  };

  return (
    <li className="flex flex-wrap items-center gap-4 py-4 sm:flex-nowrap">
      <Link href={productHref(product.slug)} className="w-20 shrink-0 overflow-hidden rounded-md">
        <ProductImage product={product} className="aspect-square" artClassName="w-[95%]" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="label text-muted">{brandName(product.brand)}</p>
        <Link href={productHref(product.slug)} className="mt-0.5 block truncate font-medium hover:text-acc-ink">
          {product.name}
        </Link>
        <p className="truncate text-sm text-muted">
          {product.colorway || "—"} · {sizes.length ? `EU ${sizes.join(", ")}` : "plus de pointure"}
        </p>
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
      <span className="font-mono text-sm tabular-nums">{formatPrice(product.price)}</span>
      {confirm ? (
        <span className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setConfirm(false)} disabled={busy}>
            Annuler
          </Button>
          <Button size="sm" onClick={remove} disabled={busy} className="bg-destructive text-white hover:bg-destructive/90">
            {busy ? "…" : "Confirmer"}
          </Button>
        </span>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setConfirm(true)} aria-label={`Supprimer ${product.name}`}>
          <Trash2 className="size-4" /> Supprimer
        </Button>
      )}
    </li>
  );
}

