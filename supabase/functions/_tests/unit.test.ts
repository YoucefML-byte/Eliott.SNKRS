import { assert, assertEquals, assertThrows } from "@std/assert";

import type { OrderRow } from "../_shared/db.ts";
import { allowedOrigins, corsHeaders, HttpError } from "../_shared/http.ts";
import { lineLabel, parseCheckout } from "../_shared/orders.ts";
import { paypalOrderBody } from "../_shared/paypal.ts";
import { checkoutSessionParams, stripeSignature, verifyStripeSignature } from "../_shared/stripe.ts";

const ORDER: OrderRow = {
  id: "0b6f2f0e-6a7e-4d0b-9a49-3f1d6a1c2b3d",
  number: "ES-1A2B3C4D",
  status: "pending",
  provider: "stripe",
  provider_ref: null,
  items: [
    {
      slug: "nocta-hot-step-2-black",
      name: "Nike × NOCTA Hot Step 2",
      brand: "nike",
      colorway: "Black",
      size: "42,5",
      qty: 1,
      price: 249,
    },
    {
      slug: "asics-gel-kayano-14-black-silver",
      name: "Asics Gel-Kayano 14",
      brand: "asics",
      colorway: "",
      size: "44",
      qty: 2,
      price: 189.5,
    },
  ],
  subtotal: 628,
  shipping_method: "express",
  shipping_price: 12.9,
  total: 640.9,
  customer: {
    email: "c@ex.fr",
    phone: "06",
    firstName: "Camille",
    lastName: "Martin",
    address: "1 rue X",
    zip: "75011",
    city: "Paris",
  },
  reserved_until: "",
  created_at: "",
  paid_at: null,
};
const URLS = { success: "https://site/ok", cancel: "https://site/ko" };

Deno.test("signature Stripe : valide, falsifiée, trop vieille", async () => {
  const secret = "whsec_test";
  const payload = '{"id":"evt_1"}';
  const t = 1_700_000_000;
  const sig = await stripeSignature(secret, String(t), payload);
  assert(await verifyStripeSignature(payload, `t=${t},v1=${sig}`, secret, t + 10));
  assert(
    await verifyStripeSignature(payload, `t=${t},v1=deadbeef,v1=${sig}`, secret, t),
    "plusieurs v1 (rotation de secret)",
  );
  assert(!(await verifyStripeSignature(payload + " ", `t=${t},v1=${sig}`, secret, t)), "contenu modifié");
  assert(!(await verifyStripeSignature(payload, `t=${t},v1=${sig}`, "whsec_autre", t)), "mauvais secret");
  assert(!(await verifyStripeSignature(payload, `t=${t},v1=${sig}`, secret, t + 301)), "rejouée 5 min plus tard");
  assert(!(await verifyStripeSignature(payload, null, secret, t)), "sans en-tête");
  assert(!(await verifyStripeSignature(payload, `t=${t}`, secret, t)), "sans v1");
});

Deno.test("session Stripe : montants en centimes, livraison, références", () => {
  const p = checkoutSessionParams(ORDER, URLS, 1000);
  assertEquals(p["line_items[0][price_data][unit_amount]"], 24900);
  assertEquals(p["line_items[1][price_data][unit_amount]"], 18950);
  assertEquals(p["line_items[1][quantity]"], 2);
  assertEquals(p["line_items[0][price_data][product_data][name]"], "Nike × NOCTA Hot Step 2 — EU 42,5");
  assertEquals(p["line_items[1][price_data][product_data][description]"], undefined, "coloris vide non envoyé");
  assertEquals(p["shipping_options[0][shipping_rate_data][fixed_amount][amount]"], 1290);
  assertEquals(p["metadata[order_id]"], ORDER.id);
  assertEquals(p.client_reference_id, ORDER.id);
  assertEquals(p.customer_email, "c@ex.fr");
  assertEquals(p.expires_at, 1000 + 31 * 60);
  assertEquals(
    p.payment_method_types,
    undefined,
    "moyens de paiement gérés depuis le tableau de bord (Apple Pay, Google Pay)",
  );
});

Deno.test("commande PayPal : le détail tombe juste au centime", () => {
  const b = paypalOrderBody(ORDER, URLS);
  const pu = b.purchase_units[0];
  assertEquals(pu.amount.value, "640.90");
  assertEquals(pu.amount.breakdown.item_total.value, "628.00");
  assertEquals(pu.amount.breakdown.shipping.value, "12.90");
  const items = pu.items.reduce((n, i) => n + Number(i.unit_amount.value) * Number(i.quantity), 0);
  assertEquals(items.toFixed(2), pu.amount.breakdown.item_total.value);
  assertEquals(pu.custom_id, ORDER.id);
  assertEquals(pu.shipping.address.postal_code, "75011");
  assertEquals(b.payment_source.paypal.experience_context.return_url, URLS.success);
});

Deno.test("validation de la demande de paiement", () => {
  const ok = {
    items: [{ slug: "a", size: "42", qty: 1 }],
    customer: { ...ORDER.customer, email: " c@ex.fr " },
    shipping: "relais",
    provider: "paypal",
  };
  assertEquals(parseCheckout(ok).customer.email, "c@ex.fr");
  assertEquals(
    parseCheckout({ ...ok, items: [{ slug: "a", size: "42", condition: "occasion-6", qty: 1 }] }).items[0].condition,
    "occasion-6",
  );
  for (
    const bad of [
      null,
      { ...ok, items: [] },
      { ...ok, items: [{ slug: "a", size: "42", qty: 9 }] },
      { ...ok, items: [{ slug: "a", size: "42", qty: 1.5 }] },
      { ...ok, items: [{ slug: "a", size: "42", condition: "comme neuf", qty: 1 }] },
      { ...ok, customer: { ...ok.customer, city: "" } },
      { ...ok, customer: { ...ok.customer, email: "x" } },
      { ...ok, shipping: "drone" },
      { ...ok, provider: "bitcoin" },
    ]
  ) {
    assertThrows(() => parseCheckout(bad), HttpError);
  }
});

Deno.test("CORS : seul le site est autorisé", () => {
  const origins = allowedOrigins("https://youcefml-byte.github.io/Eliott.SNKRS", "http://localhost:3000");
  assertEquals(origins, ["https://youcefml-byte.github.io", "http://localhost:3000"]);
  const req = (o: string) => new Request("https://x", { headers: { origin: o } });
  assertEquals(
    corsHeaders(req("https://youcefml-byte.github.io"), origins)["access-control-allow-origin"],
    "https://youcefml-byte.github.io",
  );
  assertEquals(corsHeaders(req("https://pirate.example"), origins), {});
});

Deno.test("libellé des lignes : pointure et état", () => {
  assertEquals(lineLabel({ name: "Dunk Low", size: "42" }), "Dunk Low — EU 42");
  assertEquals(lineLabel({ name: "Dunk Low", size: "42", condition: "neuf" }), "Dunk Low — EU 42 · Neuf");
  assertEquals(
    lineLabel({ name: "Dunk Low", size: "42", condition: "occasion-6" }),
    "Dunk Low — EU 42 · Occasion 6/10",
  );
  assertEquals(lineLabel({ name: "Speedy 25", size: "TU" }), "Speedy 25 — Taille unique");
});
