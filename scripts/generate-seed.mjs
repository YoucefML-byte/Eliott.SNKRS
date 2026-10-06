// Writes supabase/seed.sql from data/products.ts (the pairs shown in demo mode).
// Run with: node scripts/generate-seed.mjs
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = new URL("..", import.meta.url).pathname;
const out = join(mkdtempSync(join(tmpdir(), "seed-")), "products.mjs");
execFileSync("npx", ["--yes", "esbuild@0.25", "data/products.ts", "--bundle", "--format=esm", "--platform=node", `--alias:@=${root}`, `--outfile=${out}`], {
  cwd: root,
  stdio: "inherit",
});
const { PRODUCTS } = await import(pathToFileURL(out));

const q = (v) => (v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const json = (v) => `${q(JSON.stringify(v))}::jsonb`;

const rows = PRODUCTS.map(
  (p) =>
    `(${[q(p.slug), q(p.name), q(p.brand), q(p.colorway), q(p.collab), p.price, p.retail ?? "null", json(p.sizes), q(p.description), json(p.images), p.releaseYear, p.featured ? "true" : "false", q(`${p.arrivedAt}T12:00:00Z`)].join(", ")})`,
);

writeFileSync(
  join(root, "supabase/seed.sql"),
  `-- Les paires de la maquette, à importer une fois (SQL Editor → Run).
-- Leurs photos restent servies par le site (chemins /products/…).
insert into public.products
  (slug, name, brand, colorway, collab, price, retail, sizes, description, images, release_year, featured, created_at)
values
${rows.join(",\n")}
on conflict (slug) do nothing;
`,
);
console.log(`supabase/seed.sql: ${rows.length} paires`);
