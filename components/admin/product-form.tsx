"use client";

import { ImagePlus, Star, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { BRANDS } from "@/data/brands";
import { CATEGORIES, COLORS, DIMENSIONS, GENDERS, MOVEMENTS, ONE_SIZE, STRAPS, type CategoryId } from "@/data/taxonomy";
import type { Condition } from "@/data/types";
import { preparePhoto } from "@/lib/catalog/images";
import { useCatalog } from "@/lib/catalog/provider";
import { brandsOf, productHref } from "@/lib/products";
import { cn } from "@/lib/utils";

// EU 36 → 47 in half sizes, written the French way ("42,5")
const SIZES = Array.from({ length: 23 }, (_, i) => String(36 + i / 2).replace(".", ","));
const GRADES = [10, 9, 8, 7, 6, 5];
const MAX_PHOTOS = 8;

interface Photo {
  id: string;
  file: File;
  url: string;
}

const inputClass =
  "h-12 w-full rounded-md border border-line bg-surface px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-dim focus:border-acc";

/** "Ajouter un article" panel, opened from the header by the admin. */
export function ProductFormSheet() {
  const { admin, formOpen, setFormOpen } = useCatalog();
  if (!admin) return null;
  return (
    <Sheet
      open={formOpen}
      onClose={() => setFormOpen(false)}
      label="Ajouter un article"
      className="max-w-[600px]"
    >
      <ProductForm onDone={() => setFormOpen(false)} />
    </Sheet>
  );
}

function ProductForm({ onDone }: { onDone: () => void }) {
  const { addPair, products } = useCatalog();
  const router = useRouter();
  const brandListId = useId();
  const fileInput = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [category, setCategory] = useState<CategoryId>("chaussures");
  const cat = CATEGORIES.find((c) => c.id === category)!;
  const [condition, setCondition] = useState<Condition>("Neuf");
  const [grade, setGrade] = useState(9);
  const [sizes, setSizes] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // free the preview URLs when the panel closes
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const brandSuggestions = [
    ...new Set([...brandsOf(products).map((b) => b.name), ...BRANDS.map((b) => b.name)]),
  ];

  const addFiles = (files: FileList | File[]) => {
    const images = [...files].filter((f) => f.type.startsWith("image/"));
    setPhotos((list) =>
      [
        ...list,
        ...images.map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) })),
      ].slice(0, MAX_PHOTOS),
    );
    setError(null);
  };

  const removePhoto = (id: string) =>
    setPhotos((list) => {
      const gone = list.find((p) => p.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return list.filter((p) => p.id !== id);
    });

  const makeMain = (id: string) =>
    setPhotos((list) => [...list.filter((p) => p.id === id), ...list.filter((p) => p.id !== id)]);

  const toggleSize = (s: string) =>
    setSizes((list) => (list.includes(s) ? list.filter((x) => x !== s) : [...list, s]));

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const text = (k: string) => String(data.get(k) ?? "").trim();
    const price = Number(text("price").replace(",", "."));

    if (!photos.length) return setError("Ajoute au moins une photo.");
    if (cat.sized && !sizes.length) return setError("Choisis au moins une pointure.");
    if (!(price > 0)) return setError("Indique un prix valide.");

    setError(null);
    try {
      setStatus("Préparation des photos…");
      const prepared = await Promise.all(photos.map((p) => preparePhoto(p.file)));
      setStatus("Mise en ligne…");
      const attributes = Object.fromEntries(
        ["movement", "caseSize", "material", "strap", "dimension"].map((k) => [k, text(k)]).filter(([, v]) => v),
      );
      const product = await addPair({
        category,
        subcategory: text("subcategory") || cat.subs[0].id,
        model: text("model"),
        gender: (text("gender") || undefined) as (typeof GENDERS)[number] | undefined,
        color: text("color"),
        attributes: Object.keys(attributes).length ? attributes : undefined,
        name: text("name"),
        brand: text("brand"),
        colorway: text("colorway"),
        price,
        condition,
        grade: condition === "Occasion" ? grade : undefined,
        sizes: cat.sized ? [...sizes].sort((a, b) => SIZES.indexOf(a) - SIZES.indexOf(b)) : [ONE_SIZE],
        description: text("description"),
        photos: prepared,
      });
      onDone();
      router.push(productHref(product.slug));
    } catch (err) {
      setError(err instanceof Error ? err.message : "La mise en ligne a échoué.");
      setStatus(null);
    }
  };

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-display text-xl font-medium uppercase">Ajouter un article</h2>
        <button
          type="button"
          onClick={onDone}
          aria-label="Fermer"
          className="grid size-10 place-items-center rounded-md hover:bg-raised"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="grid flex-1 content-start gap-7 overflow-y-auto px-5 py-6">
        {/* photos */}
        <Field label="Photos" hint={`La première est la photo principale · ${MAX_PHOTOS} max`}>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            className={cn(
              "grid grid-cols-3 gap-2 rounded-md border border-dashed p-2 transition-colors sm:grid-cols-4",
              dragging ? "border-acc bg-acc/5" : "border-line",
            )}
          >
            {photos.map((p, i) => (
              <div key={p.id} className="group relative aspect-square overflow-hidden rounded-sm bg-tile">
                {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
                <img src={p.url} alt={`Photo ${i + 1}`} className="size-full object-cover" />
                {i === 0 ? (
                  <span className="label absolute bottom-1 left-1 rounded-sm bg-acc px-1.5 py-0.5 text-[9px] text-on-acc">
                    Principale
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => makeMain(p.id)}
                    aria-label={`Mettre la photo ${i + 1} en principale`}
                    className="absolute bottom-1 left-1 grid size-7 place-items-center rounded-full bg-white/90 text-tile-ink opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Star className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(p.id)}
                  aria-label={`Retirer la photo ${i + 1}`}
                  className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-white/90 text-tile-ink"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-sm bg-surface text-xs text-muted hover:text-ink"
              >
                <ImagePlus className="size-6" />
                {photos.length ? "Ajouter" : "Ajouter des photos"}
              </button>
            )}
          </div>
          <input
            ref={fileInput}
            id="photos"
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </Field>

        <Field label="Catégorie">
          <div className="grid grid-cols-2 gap-1 rounded-md border border-line p-1 sm:grid-cols-4" role="radiogroup" aria-label="Catégorie">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={category === c.id}
                onClick={() => setCategory(c.id)}
                className={cn(
                  "h-10 rounded-sm text-sm transition-colors",
                  category === c.id ? "bg-raised text-ink" : "text-muted hover:text-ink",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <select key={category} id="subcategory" name="subcategory" aria-label={cat.subLabel} className={cn(inputClass, "mt-3")}>
            {cat.subs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Nom" htmlFor="name">
          <input
            id="name"
            name="name"
            required
            placeholder={PLACEHOLDERS[category]}
            className={inputClass}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Marque" htmlFor="brand">
            <input
              id="brand"
              name="brand"
              required
              list={brandListId}
              placeholder="Nike"
              autoComplete="off"
              className={inputClass}
            />
            <datalist id={brandListId}>
              {brandSuggestions.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </Field>
          <Field label="Prix (€)" htmlFor="price">
            <input
              id="price"
              name="price"
              required
              inputMode="decimal"
              placeholder="290"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label={category === "chaussures" ? "Coloris / collab" : "Référence / détail"} htmlFor="colorway" hint="Facultatif">
          <input
            id="colorway"
            name="colorway"
            placeholder={category === "chaussures" ? "Travis Scott · Reverse Mocha" : "Monogram, cadran bleu…"}
            className={inputClass}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Couleur dominante" htmlFor="color" hint="Pour le filtre">
            <select id="color" name="color" defaultValue="" className={inputClass}>
              <option value="">—</option>
              {COLORS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id}
                </option>
              ))}
            </select>
          </Field>
          {(category === "chaussures" || category === "montres") && (
            <Field label="Modèle" htmlFor="model" hint="Facultatif">
              <input
                id="model"
                name="model"
                placeholder={category === "montres" ? "Speedmaster" : "Air Jordan 1"}
                className={inputClass}
              />
            </Field>
          )}
          {category === "chaussures" && (
            <Field label="Genre" htmlFor="gender" hint="Facultatif">
              <Select name="gender" options={GENDERS} />
            </Field>
          )}
          {category === "montres" && (
            <>
              <Field label="Mouvement" htmlFor="movement">
                <Select name="movement" options={MOVEMENTS} />
              </Field>
              <Field label="Taille du boîtier" htmlFor="caseSize" hint="Ex. 40 mm">
                <input id="caseSize" name="caseSize" placeholder="40 mm" className={inputClass} />
              </Field>
              <Field label="Bracelet" htmlFor="strap">
                <Select name="strap" options={STRAPS} />
              </Field>
            </>
          )}
          {category === "maroquinerie" && (
            <Field label="Taille" htmlFor="dimension">
              <Select name="dimension" options={DIMENSIONS} />
            </Field>
          )}
          {category !== "chaussures" && (
            <Field label="Matière" htmlFor="material" hint="Facultatif">
              <input
                id="material"
                name="material"
                placeholder={category === "montres" ? "Acier" : "Cuir de veau"}
                className={inputClass}
              />
            </Field>
          )}
        </div>

        <Field label="État">
          <div className="grid grid-cols-2 rounded-md border border-line p-1" role="radiogroup" aria-label="État">
            {(["Neuf", "Occasion"] as const).map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={condition === c}
                onClick={() => setCondition(c)}
                className={cn(
                  "h-10 rounded-sm text-sm transition-colors",
                  condition === c ? "bg-raised text-ink" : "text-muted hover:text-ink",
                )}
              >
                {c}
              </button>
            ))}
          </div>
          {condition === "Occasion" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted">Note</span>
              {GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={grade === g}
                  onClick={() => setGrade(g)}
                  className={cn(
                    "h-9 min-w-12 rounded-md border px-2 font-mono text-sm tabular-nums",
                    grade === g ? "border-acc bg-acc text-on-acc" : "border-line text-muted hover:border-ink",
                  )}
                >
                  {g}/10
                </button>
              ))}
            </div>
          )}
        </Field>

        {cat.sized ? (
        <Field label="Pointures disponibles" hint="Une paire par pointure cochée">
          <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6">
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={sizes.includes(s)}
                onClick={() => toggleSize(s)}
                className={cn(
                  "h-10 rounded-md border font-mono text-[13px] tabular-nums transition-colors",
                  sizes.includes(s)
                    ? "border-acc bg-acc text-on-acc"
                    : "border-line text-muted hover:border-ink hover:text-ink",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>
        ) : (
          <p className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-muted">
            Taille unique : une pièce est mise en vente.
          </p>
        )}

        <Field label="Description" htmlFor="description">
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Matières, détails, défauts éventuels, boîte d'origine…"
            className={cn(inputClass, "h-auto py-3 leading-relaxed")}
          />
        </Field>
      </div>

      <div className="border-t border-line px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
        {error && (
          <p role="alert" className="mb-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={Boolean(status)}>
          {status ?? "Mettre en ligne"}
        </Button>
      </div>
    </form>
  );
}

const PLACEHOLDERS: Record<CategoryId, string> = {
  chaussures: "Air Jordan 1 Low OG",
  montres: "Speedmaster Moonwatch",
  maroquinerie: "Speedy 25",
  accessoires: "Lunettes Millionaire",
};

function Select({ name, options }: { name: string; options: readonly string[] }) {
  return (
    <select id={name} name={name} defaultValue="" className={inputClass}>
      <option value="">—</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="label text-ink">
          {label}
        </label>
        {hint && <span className="text-xs text-dim">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
