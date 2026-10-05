// Generates the sneaker-brand logo SVGs used by components/ui/stack-spread.tsx.
// Run with: node scripts/generate-brand-logos.mjs
//
// Official marks come from the `simple-icons` package (CC0 path data; the
// logos themselves remain trademarks of their owners). Off-White and SB Dunk
// are not in simple-icons, so they are drawn here as typographic wordmarks.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { siAdidas, siJordan, siNewbalance, siNike, siPuma, siReebok } from "simple-icons";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "brands");
mkdirSync(OUT, { recursive: true });

const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";

// Single-path logo from simple-icons, recoloured.
const mark = (icon, fill) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-label="${icon.title}">` +
  `<path fill="${fill}" d="${icon.path}"/></svg>\n`;

const files = {
  "nike.svg": mark(siNike, "#ffffff"),
  "jordan.svg": mark(siJordan, "#111111"),
  "adidas.svg": mark(siAdidas, "#111111"),
  "new-balance.svg": mark(siNewbalance, "#ffffff"),
  "puma.svg": mark(siPuma, "#ffffff"),
  "reebok.svg": mark(siReebok, "#ffffff"),

  // Off-White: diagonal stripes + wordmark + quoted tagline.
  "off-white.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 170" role="img" aria-label="Off-White">
  <defs>
    <pattern id="stripes" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="11" height="22" fill="#111"/>
    </pattern>
  </defs>
  <rect x="30" y="0" width="180" height="78" fill="url(#stripes)"/>
  <text x="120" y="124" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="35" letter-spacing="1" fill="#111">OFF-WHITE<tspan font-size="14" dy="-16">™</tspan></text>
  <text x="120" y="160" text-anchor="middle" font-family="${FONT}" font-weight="500" font-size="15" letter-spacing="3" fill="#111">"FOR WALKING"</text>
</svg>
`,

  // SB Dunk: "DUNK" wordmark over a swoosh with an "SB" tag.
  "sb-dunk.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 190" role="img" aria-label="Nike SB Dunk">
  <text x="120" y="78" text-anchor="middle" font-family="${FONT}" font-weight="900" font-size="82" letter-spacing="-2" fill="#ffffff">DUNK</text>
  <g transform="translate(26 92) scale(6.2)"><path fill="#ffffff" d="${siNike.path}"/></g>
  <rect x="168" y="118" width="56" height="40" fill="#111"/>
  <text x="196" y="150" text-anchor="middle" font-family="${FONT}" font-weight="900" font-size="32" fill="#ffffff">SB</text>
</svg>
`,
};

for (const [name, svg] of Object.entries(files)) {
  writeFileSync(join(OUT, name), svg);
  console.log("wrote", join("public/brands", name));
}
