"use client";

import { ImagePlus, Star, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";

import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { brandName, BRANDS } from "@/data/brands";
import {
  CATEGORIES,
  categoryOf,
  COLORS,
  DIMENSIONS,
  GENDERS,
  MOVEMENTS,
  ONE_SIZE,
  SHOE_SIZES,
  STRAPS,
  subOf,
  type CategoryId,
} from "@/data/taxonomy";
import type { Condition, Product, ProductImage as Image, SizeOption } from "@/data/types";
import { preparePhoto } from "@/lib/catalog/images";
import { useCatalog } from "@/lib/catalog/provider";
import { sizeValue } from "@/lib/format";
import { brandsOf, productHref } from "@/lib/products";
import { cn } from "@/lib/utils";

// EU 35 → 48 in half sizes, written the French way ("42,5")
const SIZES = SHOE_SIZES;
const GRADES = [10, 9, 8, 7, 6, 5];
const MAX_PHOTOS = 8;
const MAX_QTY = 99;

/** a new file, or a photo already online (edit) */
interface Photo {
  id: string;
  url?: string;
  file?: File;
  image?: Image;
}

const inputClass =
  "h-12 w-full rounded-md border border-line bg-surface px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-dim focus:border-acc";

/** "Ajouter un article" / "Modifier l'article" panel, for the admin. */
export function ProductFormSheet() {
  const { admin, formOpen, setFormOpen, editing } = useCatalog();
  if (!admin) return null;
  return (
    <Sheet
      open={formOpen}
      onClose={() => setFormOpen(false)}
      label={editing ? "Modifier l'article" : "Ajouter un article"}
      className="max-w-[600px]"
    >
      <ProductForm key={editing?.slug ?? "new"} product={editing} onDone={() => setFormOpen(false)} />
    </Sheet>
  );
}

/** « 9/10 » → value of the condition picker of a size line */
const conditionValue = (o: Pick<SizeOption, "condition" | "grade">) =>
  o.condition === "Neuf" ? "neuf" : `occasion-${o.grade ?? 9}`;

function ProductForm({ product, onDone }: { product: Product | null; onDone: () => void }) {
  const { addPair, updatePair, products } = useCatalog();
  const router = useRouter();
  const brandListId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const first = product?.sizes[0];
  const initialCategory = product ? categoryOf(product).id : "chaussures";

  const [photos, setPhotos] = useState<Photo[]>(
    () => product?.images.map((image) => ({ id: crypto.randomUUID(), url: image.src, image })) ?? [],
  );
  const [category, setCategory] = useState<CategoryId>(initialCategory);
  const cat = CATEGORIES.find((c) => c.id === category)!;
  const [condition, setCondition] = useState<Condition>(first?.condition ?? "Neuf");
  const [grade, setGrade] = useState(first?.grade ?? 9);
  // stock par pointure (chaussures) ; quantité pour une taille unique
  const [stock, setStock] = useState<SizeOption[]>(product?.sizes.filter((s) => s.size !== ONE_SIZE) ?? []);
  const [oneQty, setOneQty] = useState(product?.sizes.find((s) => s.size === ONE_SIZE)?.stock ?? 1);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // free the preview URLs when the panel closes
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => p.file && p.url && URL.revokeObjectURL(p.url)), []);

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
      if (gone?.file && gone.url) URL.revokeObjectURL(gone.url);
      return list.filter((p) => p.id !== id);
    });

  const makeMain = (id: string) =>
    setPhotos((list) => [...list.filter((p) => p.id === id), ...list.filter((p) => p.id !== id)]);

  const has = (size: string) => stock.some((o) => o.size === size);
  // chaque pointure a son propre état ; une nouvelle pointure reprend celui de la dernière ajoutée
  const toggleSize = (size: string) =>
    setStock((list) => {
      if (list.some((o) => o.size === size)) return list.filter((o) => o.size !== size);
      const last = list.at(-1);
      return [...list, { size, condition: last?.condition ?? "Neuf", grade: last?.grade, stock: 1 }];
    });
  const setLine = (size: string, patch: Partial<SizeOption>) =>
    setStock((list) => list.map((o) => (o.size === size ? { ...o, ...patch } : o)));
  // taille unique : l'état est choisi pour l'article
  const oneSize: SizeOption = {
    size: ONE_SIZE,
    condition,
    grade: condition === "Occasion" ? grade : undefined,
    stock: oneQty,
  };
  const lines = [...stock].sort((a, b) => sizeValue(a.size) - sizeValue(b.size));
  const total = cat.sized ? stock.reduce((n, o) => n + o.stock, 0) : oneQty;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const text = (k: string) => String(data.get(k) ?? "").trim();
    const price = Number(text("price").replace(",", "."));

    if (!photos.length) return setError("Ajoute au moins une photo.");
    if (cat.sized && !stock.length) return setError("Choisis au moins une pointure.");
    if (!product && total === 0) return setError("Indique au moins une pièce en stock.");
    if (!(price > 0)) return setError("Indique un prix valide.");

    setError(null);
    try {
      setStatus("Préparation des photos…");
      const prepared = await Promise.all(photos.map((p) => (p.file ? preparePhoto(p.file) : p.image!)));
      setStatus(product ? "Enregistrement…" : "Mise en ligne…");
      const attributes = Object.fromEntries(
        ["movement", "caseSize", "material", "strap", "dimension"].map((k) => [k, text(k)]).filter(([, v]) => v),
      );
      const input = {
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
        sizes: cat.sized ? lines : [oneSize],
        description: text("description"),
        photos: prepared,
      };
      if (product) {
        await updatePair(product, input);
        onDone();
      } else {
        const created = await addPair(input);
        onDone();
        router.push(productHref(created.slug));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "La mise en ligne a échoué.");
      setStatus(null);
    }
  };

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-display text-xl font-medium uppercase">
          {product ? "Modifier l'article" : "Ajouter un article"}
        </h2>
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
                {p.url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local preview
                  <img src={p.url} alt={`Photo ${i + 1}`} className="size-full object-cover" />
                ) : (
                  product && <ProductImage product={product} image={p.image} className="size-full" />
                )}
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
          <select
            key={category}
            id="subcategory"
            name="subcategory"
            aria-label={cat.subLabel}
            defaultValue={product && category === initialCategory ? subOf(product).id : undefined}
            className={cn(inputClass, "mt-3")}
          >
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
            defaultValue={product?.name}
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
              defaultValue={product ? brandName(product.brand) : undefined}
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
              defaultValue={product ? String(product.price).replace(".", ",") : undefined}
              placeholder="290"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label={category === "chaussures" ? "Coloris / collab" : "Référence / détail"} htmlFor="colorway" hint="Facultatif">
          <input
            id="colorway"
            name="colorway"
            defaultValue={product?.colorway}
            placeholder={category === "chaussures" ? "Travis Scott · Reverse Mocha" : "Monogram, cadran bleu…"}
            className={inputClass}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Couleur dominante" htmlFor="color" hint="Pour le filtre">
            <select id="color" name="color" defaultValue={product?.color ?? ""} className={inputClass}>
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
                defaultValue={product?.model}
                placeholder={category === "montres" ? "Speedmaster" : "Air Jordan 1"}
                className={inputClass}
              />
            </Field>
          )}
          {category === "chaussures" && (
            <Field label="Genre" htmlFor="gender" hint="Facultatif">
              <Select name="gender" options={GENDERS} value={product?.gender} />
            </Field>
          )}
          {category === "montres" && (
            <>
              <Field label="Mouvement" htmlFor="movement">
                <Select name="movement" options={MOVEMENTS} value={product?.attributes?.movement} />
              </Field>
              <Field label="Taille du boîtier" htmlFor="caseSize" hint="Ex. 40 mm">
                <input
                  id="caseSize"
                  name="caseSize"
                  defaultValue={product?.attributes?.caseSize}
                  placeholder="40 mm"
                  className={inputClass}
                />
              </Field>
              <Field label="Bracelet" htmlFor="strap">
                <Select name="strap" options={STRAPS} value={product?.attributes?.strap} />
              </Field>
            </>
          )}
          {category === "maroquinerie" && (
            <Field label="Taille" htmlFor="dimension">
              <Select name="dimension" options={DIMENSIONS} value={product?.attributes?.dimension} />
            </Field>
          )}
          {category !== "chaussures" && (
            <Field label="Matière" htmlFor="material" hint="Facultatif">
              <input
                id="material"
                name="material"
                defaultValue={product?.attributes?.material}
                placeholder={category === "montres" ? "Acier" : "Cuir de veau"}
                className={inputClass}
              />
            </Field>
          )}
        </div>

        {!cat.sized && (
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
        )}

        {cat.sized ? (
          <Field label="Pointures, état et stock" hint="Touche une pointure, puis choisis son état et le nombre de paires">
            <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={has(s)}
                  onClick={() => toggleSize(s)}
                  className={cn(
                    "h-10 rounded-md border font-mono text-[13px] tabular-nums transition-colors",
                    has(s) ? "border-acc bg-acc text-on-acc" : "border-line text-muted hover:border-ink hover:text-ink",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            {lines.length > 0 && (
              <>
                <div className="mt-4 rounded-md border border-line">
                  <div className="label flex items-center gap-2 border-b border-line py-2 pl-3 pr-1 text-[10px] text-dim" aria-hidden>
                    <span className="w-16 shrink-0">Pointure</span>
                    <span className="flex-1">État</span>
                    <span className="w-[98px] text-center">Paires</span>
                    <span className="size-9 shrink-0" />
                  </div>
                  <ul className="divide-y divide-line" aria-label="Stock par pointure">
                    {lines.map((o) => (
                      <li key={o.size} className="flex items-center gap-2 py-2 pl-3 pr-1">
                        <span className="w-16 shrink-0">
                          <span className={cn("block font-mono text-sm tabular-nums", o.stock === 0 && "text-dim line-through")}>
                            {o.size}
                          </span>
                          {o.stock === 0 && <span className="block text-[10px] uppercase text-dim">Épuisée</span>}
                        </span>
                        <select
                          aria-label={`État de la pointure ${o.size}`}
                          value={conditionValue(o)}
                          onChange={(e) => {
                            const v = e.target.value;
                            setLine(
                              o.size,
                              v === "neuf"
                                ? { condition: "Neuf", grade: undefined }
                                : { condition: "Occasion", grade: Number(v.split("-")[1]) },
                            );
                          }}
                          className="h-9 min-w-0 flex-1 rounded-md border border-line bg-surface px-2 text-sm text-ink outline-none focus:border-acc"
                        >
                          <option value="neuf">Neuf</option>
                          {GRADES.map((g) => (
                            <option key={g} value={`occasion-${g}`}>
                              Occ. {g}/10
                            </option>
                          ))}
                        </select>
                        <QuantityStepper
                          value={o.stock}
                          min={0}
                          max={MAX_QTY}
                          onChange={(n) => setLine(o.size, { stock: n })}
                          label={`Nombre de paires en ${o.size}`}
                          maxTitle="Maximum atteint"
                        />
                        <button
                          type="button"
                          onClick={() => toggleSize(o.size)}
                          aria-label={`Retirer la pointure ${o.size}`}
                          className="grid size-9 shrink-0 place-items-center rounded-md text-muted hover:bg-raised hover:text-ink"
                        >
                          <X className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-2 text-right font-mono text-xs text-muted">
                  {total} paire{total > 1 ? "s" : ""} en stock
                </p>
              </>
            )}
          </Field>
        ) : (
          <Field label="Quantité en stock" hint="Taille unique">
            <div className="flex items-center justify-between rounded-md border border-line px-4 py-2">
              <span className={cn("text-sm", oneQty === 0 ? "text-dim" : "text-muted")}>
                {oneQty === 0 ? "Épuisé" : oneQty === 1 ? "Pièce unique" : `${oneQty} pièces`}
              </span>
              <QuantityStepper
                value={oneQty}
                min={product ? 0 : 1}
                max={MAX_QTY}
                onChange={setOneQty}
                label="Quantité en stock"
                maxTitle="Maximum atteint"
              />
            </div>
          </Field>
        )}

        <Field label="Description" htmlFor="description">
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={product?.description}
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
          {status ?? (product ? "Enregistrer les modifications" : "Mettre en ligne")}
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

function Select({ name, options, value }: { name: string; options: readonly string[]; value?: string }) {
  return (
    <select id={name} name={name} defaultValue={value ?? ""} className={inputClass}>
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
