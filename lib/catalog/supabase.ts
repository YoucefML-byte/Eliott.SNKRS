import type { SupabaseClient } from "@supabase/supabase-js";

import type { Product, ProductImage, SizeOption } from "@/data/types";
import { asset } from "@/lib/asset";

import { buildProduct, makeSlug, NEUTRAL_COLORS } from "./build";
import type { CatalogBackend } from "./types";

// Production mode: pairs in a Supabase (PostgreSQL) table, photos in Supabase
// Storage. Security lives in the database rules (supabase/schema.sql): anyone
// can read, only an account listed in `admins` can add or delete.

const BUCKET = "products";

interface Row {
  id: string;
  slug: string;
  name: string;
  brand: string;
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

const toProduct = (r: Row): Product => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  brand: r.brand,
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
    const urls: string[] = [];
    for (const [i, photo] of input.photos.entries()) {
      const ext = photo.type === "image/webp" ? "webp" : "jpg";
      const path = `${slug}/${i + 1}.${ext}`;
      const { error } = await sb.storage.from(BUCKET).upload(path, photo, { contentType: photo.type });
      if (error) throw new Error(`Envoi de la photo ${i + 1} impossible : ${error.message}`);
      urls.push(sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    }

    const p = buildProduct(input, slug, urls);
    const { data, error } = await sb
      .from("products")
      .insert({
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        colorway: p.colorway,
        price: p.price,
        sizes: p.sizes,
        description: p.description,
        images: p.images,
      })
      .select()
      .single();
    if (error) {
      await sb.storage.from(BUCKET).remove(urls.map(storagePath).filter(Boolean) as string[]);
      throw new Error(`Enregistrement impossible : ${error.message}`);
    }
    return toProduct(data as Row);
  },

  async remove(product) {
    const sb = await supabase();
    const { error } = await sb.from("products").delete().eq("slug", product.slug);
    if (error) throw new Error(`Suppression impossible : ${error.message}`);
    const paths = product.images.map((i) => storagePath(i.src)).filter(Boolean) as string[];
    if (paths.length) await sb.storage.from(BUCKET).remove(paths);
  },
};
