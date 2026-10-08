import { PRODUCTS } from "@/data/products";
import type { Product } from "@/data/types";

import { buildProduct, editedProduct, imagesFrom, makeSlug, newPhotos } from "./build";
import { blobToDataUrl } from "./images";
import type { AdminUser, CatalogBackend } from "./types";

// Demo mode: no server. The bundled pairs plus whatever the admin adds,
// kept in this browser only — enough to present the admin flow.

export const DEMO_ADMIN = { email: "admin@eliott-snkrs.fr", password: "eliott-demo" };

const ADDED = "eliott-demo-added-v1";
const HIDDEN = "eliott-demo-hidden-v1";
/** edited versions of the bundled articles, by slug */
const EDITED = "eliott-demo-edited-v1";
const SESSION = "eliott-demo-admin-v1";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error("Le navigateur n'a plus de place pour les photos de démo. Supprime une paire ajoutée.");
  }
}

export const demoBackend: CatalogBackend = {
  mode: "demo",

  async list() {
    const hidden = new Set(read<string[]>(HIDDEN, []));
    const added = read<Product[]>(ADDED, []);
    const edited = read<Record<string, Product>>(EDITED, {});
    return [...added, ...PRODUCTS.map((p) => edited[p.slug] ?? p)].filter((p) => !hidden.has(p.slug));
  },

  async currentAdmin() {
    return read<AdminUser | null>(SESSION, null);
  },

  async signIn(email, password) {
    if (email.trim().toLowerCase() !== DEMO_ADMIN.email || password !== DEMO_ADMIN.password) {
      throw new Error("E-mail ou mot de passe incorrect.");
    }
    const user = { email: DEMO_ADMIN.email };
    write(SESSION, user);
    return user;
  },

  async signOut() {
    localStorage.removeItem(SESSION);
  },

  async create(input) {
    const urls = await Promise.all(newPhotos(input).map(blobToDataUrl));
    const product = buildProduct(input, makeSlug(input), imagesFrom(input, urls));
    write(ADDED, [product, ...read<Product[]>(ADDED, [])]);
    return product;
  },

  async update(product, input) {
    const urls = await Promise.all(newPhotos(input).map(blobToDataUrl));
    const next = editedProduct(product, input, imagesFrom(input, urls));
    const added = read<Product[]>(ADDED, []);
    if (added.some((p) => p.slug === product.slug)) {
      write(ADDED, added.map((p) => (p.slug === product.slug ? next : p)));
    } else {
      write(EDITED, { ...read<Record<string, Product>>(EDITED, {}), [product.slug]: next });
    }
    return next;
  },

  async remove(product) {
    const added = read<Product[]>(ADDED, []);
    if (added.some((p) => p.slug === product.slug)) {
      write(ADDED, added.filter((p) => p.slug !== product.slug));
    } else {
      write(HIDDEN, [...read<string[]>(HIDDEN, []), product.slug]);
    }
  },
};
