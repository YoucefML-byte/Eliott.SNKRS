import type { SupabaseClient } from "@supabase/supabase-js";

import type { Product, ProductImage, SizeOption } from "@/data/types";
import { asset, BASE_PATH } from "@/lib/asset";

import { buildProduct, editedProduct, imagesFrom, makeSlug, NEUTRAL_COLORS, newPhotos } from "./build";
import type { CatalogBackend, NewPairInput } from "./types";

// Production mode: pairs in a Supabase (PostgreSQL) table, photos in Supabase
// Storage. Security lives in the database rules (supabase/schema.sql): anyone
// can read, only an account listed in `admins` can add or delete.

const BUCKET = "products";

interface Row {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string | null;
  subcategory: string | null;
  model: string | null;
  gender: string | null;
  color: string | null;
  attributes: Product["attributes"] | null;
  colorway: string;
  collab: string | null;
  price: number | string;
  retail: number | string | null;
  sizes: SizeOption[];
  description: string;
  images: ProductImage[];
  release_year: number | null;
  featured: boolean;
  created_at: string;
}

let client: Promise<SupabaseClient> | null = null;
/** client Supabase partagé (session admin comprise), chargé à la demande */
export const supabase = () =>
  (client ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
  ));

// images seeded from the repo are stored as "/products/…" paths
const resolveSrc = (src?: string) => (src && src.startsWith("/") ? asset(src) : src);
/** inverse of resolveSrc, to save a gallery back */
const storedSrc = (src?: string) =>
  src && BASE_PATH && src.startsWith(`${BASE_PATH}/`) ? src.slice(BASE_PATH.length) : src;

const toProduct = (r: Row): Product => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  brand: r.brand,
  category: (r.category ?? undefined) as Product["category"],
  subcategory: r.subcategory ?? undefined,
  model: r.model ?? undefined,
  gender: (r.gender ?? undefined) as Product["gender"],
  color: r.color ?? undefined,
  attributes: r.attributes && Object.keys(r.attributes).length ? r.attributes : undefined,
  colorway: r.colorway,
  collab: r.collab ?? undefined,
  silhouette: "low",
  colors: NEUTRAL_COLORS,
  price: Number(r.price),
  retail: r.retail == null ? undefined : Number(r.retail),
  sizes: r.sizes,
  images: r.images.map((img) => ({ ...img, src: resolveSrc(img.src) })),
  arrivedAt: r.created_at.slice(0, 10),
  releaseYear: r.release_year ?? undefined,
  description: r.description,
  featured: r.featured,
});

/** storage path of an uploaded photo, from its public URL */
const storagePath = (url?: string) => url?.split(`/object/public/${BUCKET}/`)[1];

async function isAdmin(sb: SupabaseClient, userId: string) {
  const { data } = await sb.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  return Boolean(data);
}

export const supabaseBackend: CatalogBackend = {
  mode: "supabase",

  async list() {
    const sb = await supabase();
    const { data, error } = await sb.from("products").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(`Impossible de charger le stock : ${error.message}`);
    return (data as Row[]).map(toProduct);
  },

  async currentAdmin() {
    const sb = await supabase();
    const { data } = await sb.auth.getSession();
    const user = data.session?.user;
    if (!user || !(await isAdmin(sb, user.id))) return null;
    return { email: user.email ?? "" };
  },

  async signIn(email, password) {
    const sb = await supabase();
    const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user) throw new Error("E-mail ou mot de passe incorrect.");
    if (!(await isAdmin(sb, data.user.id))) {
      await sb.auth.signOut();
      throw new Error("Ce compte n'a pas accès à la gestion du stock.");
    }
    return { email: data.user.email ?? email };
  },

  async signOut() {
    const sb = await supabase();
    await sb.auth.signOut();
  },

  async create(input) {
    const sb = await supabase();
    const slug = makeSlug(input);
    const urls = await upload(sb, slug, input);
    const p = buildProduct(input, slug, imagesFrom(input, urls));
    const { data, error } = await sb
      .from("products")
      .insert({ slug: p.slug, ...rowFields(p) })
      .select()
      .single();
    if (error) {
      await removePhotos(sb, urls);
      throw new Error(`Enregistrement impossible : ${error.message}`);
    }
    return toProduct(data as Row);
  },

  async update(product, input) {
    const sb = await supabase();
    const urls = await upload(sb, product.slug, input);
    const p = editedProduct(product, input, imagesFrom(input, urls));
    const { data, error } = await sb
      .from("products")
      .update(rowFields(p))
      .eq("slug", product.slug)
      .select()
      .single();
    if (error) {
      await removePhotos(sb, urls);
      throw new Error(`Enregistrement impossible : ${error.message}`);
    }
    // photos retirées de la fiche
    const kept = new Set(p.images.map((i) => i.src));
    await removePhotos(sb, product.images.map((i) => i.src).filter((src) => src && !kept.has(src)) as string[]);
    return toProduct(data as Row);
  },

  async remove(product) {
    const sb = await supabase();
    const { error } = await sb.from("products").delete().eq("slug", product.slug);
    if (error) throw new Error(`Suppression impossible : ${error.message}`);
    await removePhotos(sb, product.images.map((i) => i.src).filter(Boolean) as string[]);
  },
};

/** uploads the new photos of the form, returns their public URLs */
async function upload(sb: SupabaseClient, slug: string, input: NewPairInput) {
  const urls: string[] = [];
  // unique names: an edit adds photos next to the ones already online
  const batch = Date.now().toString(36);
  for (const [i, photo] of newPhotos(input).entries()) {
    const ext = photo.type === "image/webp" ? "webp" : "jpg";
    const path = `${slug}/${batch}-${i + 1}.${ext}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, photo, { contentType: photo.type });
    if (error) {
      await removePhotos(sb, urls);
      throw new Error(`Envoi de la photo ${i + 1} impossible : ${error.message}`);
    }
    urls.push(sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
  }
  return urls;
}

/** deletes uploaded photos (the ones bundled with the site are not in Storage) */
async function removePhotos(sb: SupabaseClient, urls: string[]) {
  const paths = urls.map(storagePath).filter(Boolean) as string[];
  if (paths.length) await sb.storage.from(BUCKET).remove(paths);
}

/** columns the admin form sets */
const rowFields = (p: Product) => ({
  name: p.name,
  brand: p.brand,
  category: p.category,
  subcategory: p.subcategory,
  model: p.model ?? null,
  gender: p.gender ?? null,
  color: p.color ?? null,
  attributes: p.attributes ?? {},
  colorway: p.colorway,
  price: p.price,
  sizes: p.sizes,
  description: p.description,
  images: p.images.map((img) => ({ ...img, src: storedSrc(img.src) })),
});
