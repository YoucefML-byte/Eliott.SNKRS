import { demoBackend } from "./demo";
import { supabaseBackend } from "./supabase";

/** Supabase when its keys are set at build time, otherwise the demo store. */
export const catalogBackend =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? supabaseBackend
    : demoBackend;

export type { AdminUser, CatalogBackend, NewPairInput } from "./types";
