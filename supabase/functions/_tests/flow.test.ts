// Parcours complets checkout → paiement → confirmation, avec les vraies
// fonctions SQL (supabase/payments.sql) sur un PostgreSQL local et de faux
// Stripe / PayPal. Nécessite TEST_DATABASE_URL vers une base vide, ex. :
//   TEST_DATABASE_URL=postgres://postgres:pw@localhost:5432/paytest deno test -A
// Sans cette variable, ces tests sont ignorés.

import { assert, assertEquals, assertMatch } from "@std/assert";

import { handleCheckout } from "../checkout/handler.ts";
import { handleConfirmOrder } from "../confirm-order/handler.ts";
import { restDb } from "../_shared/db.ts";
import type { Deps } from "../_shared/deps.ts";
import { stripeSignature } from "../_shared/stripe.ts";
import { handleShipOrder } from "../ship-order/handler.ts";
import { handleStripeWebhook } from "../stripe-webhook/handler.ts";
import { fakePostgrest } from "./fake-postgrest.ts";
import { fakeProviders } from "./fakes.ts";

const DB_URL = Deno.env.get("TEST_DATABASE_URL");
const SITE = "https://youcefml-byte.github.io/Eliott.SNKRS";
const ORIGIN = "https://youcefml-byte.github.io";
const KEY = "service-role-test-key";
const WHSEC = "whsec_test_secret";
const AJ = "air-jordan-1-low-travis-scott-reverse-mocha"; // 1190 €
const NB = "new-balance-2002r-protection-pack-pink"; // 219 €, EU 38 et 40
const ASICS = "asics-gel-kayano-14-black-silver"; // 189 €, EU 40,5 / 42 / 43
const ADMIN = "11111111-1111-4111-8111-111111111111";
const VISITOR = "22222222-2222-4222-8222-222222222222";
const TOKENS: Record<string, string> = { "jeton-admin": ADMIN, "jeton-visiteur": VISITOR };
const CUSTOMER = {
  email: "client@exemple.fr",
  phone: "0600000000",
  firstName: "Camille",
  lastName: "Martin",
  address: "12 rue Oberkampf",
  zip: "75011",
  city: "Paris",
};

async function setup() {
  const pgrest = await fakePostgrest(DB_URL!, KEY);
  const sql = (f: string) => Deno.readTextFile(new URL(f, import.meta.url));
  await pgrest.query(
    "drop schema public cascade; create schema public; drop schema if exists auth cascade; drop schema if exists storage cascade",
  );
  for (const f of ["./supabase-stub.sql", "../../schema.sql", "../../seed.sql", "../../payments.sql"]) {
    await pgrest.query(await sql(f));
  }
  const fakes = fakeProviders();
  let now = Math.floor(Date.now() / 1000);
  const deps: Deps = {
    db: restDb(pgrest.url, KEY, fakes.fetch),
    fetch: fakes.fetch,
    siteUrl: SITE,
    origins: [ORIGIN],
    stripeKey: "sk_test_123",
    stripeWebhookSecret: WHSEC,
    paypal: { clientId: "pp-id", secret: "pp-secret", env: "sandbox" },
    mail: { apiKey: "xkeysib-test", from: "commandes@eliott-snkrs.fr", fromName: "Eliott SNKRS" },
    userFromToken: (jwt) => Promise.resolve(TOKENS[jwt] ?? null),
    nowSec: () => now,
  };
  await pgrest.query(
    "insert into auth.users (id, email) values ($1, 'eliott@exemple.fr'), ($2, 'curieux@exemple.fr')",
    [
      ADMIN,
      VISITOR,
    ],
  );
  await pgrest.query("insert into public.admins (user_id) values ($1)", [ADMIN]);
  const stock = async (slug: string, size: string) =>
    (await pgrest.query(
      `select (e->>'stock')::int s from products, jsonb_array_elements(sizes) e where slug=$1 and e->>'size'=$2`,
      [slug, size],
    )).rows[0]?.s;
  const status = async (id: string) =>
    (await pgrest.query("select status from orders where id=$1", [id])).rows[0]?.status;
  const post = (body: unknown) =>
    new Request("https://fn/checkout", {
      method: "POST",
      headers: { origin: ORIGIN, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  const checkout = async (items: unknown[], provider: string, shipping = "colissimo") => {
    const res = await handleCheckout(post({ items, customer: CUSTOMER, shipping, provider }), deps);
    return { res, body: await res.json() };
  };
  const confirm = async (order: string, action?: string) =>
    (await handleConfirmOrder(post({ order, action }), deps)).json();
  const webhook = async (event: unknown, secret = WHSEC) => {
    const payload = JSON.stringify(event);
    const sig = await stripeSignature(secret, String(now), payload);
    return handleStripeWebhook(
      new Request("https://fn/stripe-webhook", {
        method: "POST",
        headers: { "stripe-signature": `t=${now},v1=${sig}` },
        body: payload,
      }),
      deps,
    );
  };
  const ship = async (token: string | null, body: unknown) => {
    const res = await handleShipOrder(
      new Request("https://fn/ship-order", {
        method: "POST",
        headers: { origin: ORIGIN, ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      }),
      deps,
    );
    return { res, body: await res.json() };
  };
  return { pgrest, fakes, deps, stock, status, checkout, confirm, webhook, ship, setNow: (s: number) => (now = s) };
}

Deno.test({
  name: "paiement de bout en bout",
  ignore: !DB_URL,
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    const env = await setup();
    const { fakes, stock, status, checkout, confirm, webhook } = env;
    try {
      await t.step("Stripe : commande réservée, payée par webhook, idempotente", async () => {
        const before = await stock(AJ, "44");
        const { res, body } = await checkout([{ slug: AJ, size: "44", qty: 1, price: 1 }], "stripe");
        assertEquals(res.status, 200);
        assertEquals(res.headers.get("access-control-allow-origin"), ORIGIN);
        assertMatch(body.url, /^https:\/\/checkout\.stripe\.com\//);
        assertMatch(body.order.number, /^ES-[0-9A-F]{8}$/);
        assertEquals(await stock(AJ, "44"), before - 1, "paire réservée");

        const session = [...fakes.sessions.values()].at(-1) as {
          id: string;
          params: Record<string, string>;
          amount_total: number;
        };
        assertEquals(
          session.params["line_items[0][price_data][unit_amount]"],
          "119000",
          "prix de la base, pas celui du navigateur",
        );
        assertEquals(session.amount_total, 119000, "livraison offerte au-delà de 300 €");
        assertEquals(session.params.success_url, `${SITE}/checkout/confirmation/?commande=${body.order.id}`);

        assertEquals((await confirm(body.order.id)).order.status, "pending", "pas encore payé");
        const paid = fakes.payStripe(session.id);
        const ev = { type: "checkout.session.completed", data: { object: paid } };
        assertEquals((await webhook(ev)).status, 200);
        assertEquals(await status(body.order.id), "paid");
        assertEquals((await webhook(ev)).status, 200, "webhook reçu deux fois");
        assertEquals(await stock(AJ, "44"), before - 1, "… sans retirer une 2e paire");
        const c = await confirm(body.order.id);
        assertEquals(c.order.status, "paid");
        assertEquals(c.order.total, 1190);
        assertEquals(c.order.firstName, "Camille");
        assertEquals(c.order.phone, undefined, "pas plus de données que nécessaire");
      });

      await t.step("Stripe : la page de confirmation valide même si le webhook tarde", async () => {
        const { body } = await checkout([{ slug: NB, size: "38", qty: 1 }], "stripe", "relais");
        const session = [...fakes.sessions.values()].at(-1) as { id: string; amount_total: number };
        assertEquals(session.amount_total, 21900 + 490);
        fakes.payStripe(session.id);
        assertEquals((await confirm(body.order.id)).order.status, "paid");
      });

      await t.step("Stripe : faux webhook refusé", async () => {
        const { body } = await checkout([{ slug: NB, size: "40", qty: 1 }], "stripe");
        const forged = {
          type: "checkout.session.completed",
          data: { object: { id: "cs_x", payment_status: "paid", metadata: { order_id: body.order.id } } },
        };
        assertEquals((await webhook(forged, "whsec_pirate")).status, 400);
        assertEquals(await status(body.order.id), "pending");
        // retour arrière depuis Stripe : session fermée, paire remise en stock
        const before = await stock(NB, "40");
        assertEquals((await confirm(body.order.id, "cancel")).order.status, "cancelled");
        assertEquals(await stock(NB, "40"), before + 1);
        assertEquals(([...fakes.sessions.values()].at(-1) as { status: string }).status, "expired");
      });

      await t.step("Stripe : session expirée → paires libérées", async () => {
        const { body } = await checkout([{ slug: NB, size: "40", qty: 1 }], "stripe");
        const before = await stock(NB, "40");
        const s = [...fakes.sessions.values()].at(-1) as { id: string };
        await webhook({
          type: "checkout.session.expired",
          data: { object: { id: s.id, metadata: { order_id: body.order.id } } },
        });
        assertEquals(await status(body.order.id), "cancelled");
        assertEquals(await stock(NB, "40"), before + 1);
      });

      await t.step("PayPal : validation puis encaissement au retour", async () => {
        const { res, body } = await checkout([{ slug: ASICS, size: "40,5", qty: 1 }], "paypal", "express");
        assertEquals(res.status, 200);
        assertMatch(body.url, /sandbox\.paypal\.com\/checkoutnow\?token=PP/);
        const pp = [...fakes.paypalOrders.values()].at(-1)!;
        assertEquals(
          pp.body.purchase_units[0].amount.value,
          "201.90",
          "189 € + express 12,90 € (payant même au-delà de 300 €)",
        );

        assertEquals((await confirm(body.order.id)).order.status, "pending", "pas encore validé chez PayPal");
        fakes.approvePaypal(pp.id);
        const c = await confirm(body.order.id);
        assertEquals(c.order.status, "paid");
        const captures = () => fakes.calls.filter((x) => x.url.endsWith("/capture")).length;
        const n = captures();
        assertEquals((await confirm(body.order.id)).order.status, "paid", "page rechargée");
        assertEquals(captures(), n, "pas de second encaissement");
      });

      await t.step("PayPal : montant encaissé différent → pas marqué payé", async () => {
        const { body } = await checkout([{ slug: ASICS, size: "42", qty: 1 }], "paypal");
        fakes.approvePaypal([...fakes.paypalOrders.values()].at(-1)!.id);
        fakes.captureAmount = "1.00";
        const res = await handleConfirmOrder(
          new Request("https://fn", { method: "POST", body: JSON.stringify({ order: body.order.id }) }),
          env.deps,
        );
        fakes.captureAmount = null;
        assertEquals(res.status, 500);
        assertEquals(await status(body.order.id), "pending");
      });

      await t.step("PayPal : réservation expirée → rien n'est encaissé", async () => {
        const { body } = await checkout([{ slug: "prada-americas-cup-red", size: "42", qty: 1 }], "paypal");
        fakes.approvePaypal([...fakes.paypalOrders.values()].at(-1)!.id);
        await env.pgrest.query("update orders set reserved_until = now() - interval '1 minute' where id = $1", [
          body.order.id,
        ]);
        await env.pgrest.query("select release_expired_orders()");
        const n = fakes.calls.length;
        const c = await confirm(body.order.id);
        assertEquals([c.order.status, c.notice], ["cancelled", "expired"]);
        assertEquals(fakes.calls.length, n, "aucun appel PayPal");
      });

      await t.step("paire déjà vendue → message clair, rien de créé", async () => {
        const { res, body } = await checkout([{ slug: "maison-margiela-replica-gat", size: "43", qty: 1 }], "stripe");
        assertEquals(res.status, 409);
        assertEquals(body.error, "out_of_stock");
        assertMatch(body.message, /vendue/);
      });

      await t.step("même pointure dans deux états : chaque ligne de stock a sa réservation", async () => {
        const GUTTA = "corteiz-air-max-95-gutta-green";
        const GUTTA_PRICE =
          (await env.pgrest.query("select price from products where slug = $1", [GUTTA])).rows[0].price;
        await env.pgrest.query(
          `update products set sizes = '[{"size":"44","condition":"Neuf","stock":1},` +
            `{"size":"44","condition":"Occasion","grade":6,"stock":2,"price":120}]'::jsonb where slug = $1`,
          [GUTTA],
        );
        const line = async (cond: string) =>
          (await env.pgrest.query(
            `select (e->>'stock')::int s from products, jsonb_array_elements(sizes) e
              where slug = $1 and e->>'size' = '44' and condition_code(e) = $2`,
            [GUTTA, cond],
          )).rows[0]?.s;

        const { res, body } = await checkout([{ slug: GUTTA, size: "44", condition: "occasion-6", qty: 1 }], "stripe");
        assertEquals(res.status, 200);
        assertEquals([await line("neuf"), await line("occasion-6")], [1, 1], "seule la paire en 6/10 est réservée");
        const session = [...fakes.sessions.values()].at(-1) as { params: Record<string, string> };
        assertMatch(session.params["line_items[0][price_data][product_data][name]"], /EU 44 · Occasion 6\/10$/);
        assertEquals(session.params["line_items[0][price_data][unit_amount]"], "12000", "prix de l'état, lu en base");
        const reserved = (await confirm(body.order.id)).order;
        assertEquals([reserved.items[0].condition, reserved.items[0].price, reserved.subtotal], [
          "occasion-6",
          120,
          120,
        ]);
        assertEquals((await confirm(body.order.id, "cancel")).order.status, "cancelled");
        assertEquals(await line("occasion-6"), 2, "remise en stock dans le bon état");

        // ancien panier sans état : la première ligne de la pointure
        const old = await checkout([{ slug: GUTTA, size: "44", qty: 1 }], "stripe");
        assertEquals(old.res.status, 200);
        assertEquals([await line("neuf"), await line("occasion-6")], [0, 2]);
        const neuf = (await confirm(old.body.order.id)).order;
        assertEquals(neuf.items[0].condition, "neuf");
        assertEquals(neuf.items[0].price, Number(GUTTA_PRICE), "sans prix d'état : le prix de l'article");

        // état absent de la fiche → refusé, rien de réservé
        const ghost = await checkout([{ slug: GUTTA, size: "44", condition: "occasion-9", qty: 1 }], "stripe");
        assertEquals(ghost.body.error, "unknown_size");
        assertEquals(await line("occasion-6"), 2);
      });

      await t.step("Stripe en panne → réservation annulée aussitôt", async () => {
        const before = await stock(ASICS, "43");
        fakes.stripeDown = true;
        const { res } = await checkout([{ slug: ASICS, size: "43", qty: 1 }], "stripe");
        fakes.stripeDown = false;
        assertEquals(res.status, 500);
        assertEquals(await stock(ASICS, "43"), before);
      });

      await t.step("moyen de paiement non configuré → 503", async () => {
        const saved = env.deps.paypal;
        env.deps.paypal = undefined;
        const { res } = await checkout([{ slug: ASICS, size: "43", qty: 1 }], "paypal");
        env.deps.paypal = saved;
        assertEquals(res.status, 503);
      });

      await t.step("commande inconnue / identifiant invalide", async () => {
        const res = await handleConfirmOrder(
          new Request("https://fn", { method: "POST", body: JSON.stringify({ order: crypto.randomUUID() }) }),
          env.deps,
        );
        assertEquals(res.status, 404);
        const bad = await handleConfirmOrder(
          new Request("https://fn", { method: "POST", body: JSON.stringify({ order: "1 or 1=1" }) }),
          env.deps,
        );
        assertEquals(bad.status, 400);
      });

      await t.step("factures : numéros continus pour les commandes payées, et seulement elles", async () => {
        const year = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris", year: "numeric" });
        const rows = (await env.pgrest.query(
          "select status, invoice_number from orders order by paid_at nulls last, created_at",
        )).rows as { status: string; invoice_number: string | null }[];
        const paid = rows.filter((r) => r.status === "paid" || r.status === "shipped");
        assert(paid.length >= 3);
        assertEquals(
          paid.map((r) => r.invoice_number),
          paid.map((_, i) => `F-${year}-${String(i + 1).padStart(5, "0")}`),
          "F-année-00001, 00002… dans l'ordre de paiement, sans trou",
        );
        assert(
          rows.filter((r) => !paid.includes(r)).every((r) => r.invoice_number === null),
          "pas de facture sans paiement",
        );

        // relancer payments.sql (mise à jour du site) ne renumérote rien
        await env.pgrest.query(await Deno.readTextFile(new URL("../../payments.sql", import.meta.url)));
        const again = (await env.pgrest.query(
          "select invoice_number from orders where invoice_number is not null order by invoice_number",
        )).rows.map((r: { invoice_number: string }) => r.invoice_number);
        assertEquals(again, paid.map((r) => r.invoice_number).sort());

        // commande payée avant les factures : numérotée au prochain passage du script
        const legacy = paid[0].invoice_number;
        await env.pgrest.query("update orders set invoice_number = null where invoice_number = $1", [legacy]);
        await env.pgrest.query(await Deno.readTextFile(new URL("../../payments.sql", import.meta.url)));
        const next = `F-${year}-${String(paid.length + 1).padStart(5, "0")}`;
        assertEquals(
          (await env.pgrest.query("select count(*)::int n from orders where invoice_number = $1", [next])).rows[0].n,
          1,
        );
      });

      await t.step("expédition : seul l'admin connecté, e-mail envoyé une seule fois", async () => {
        const { fakes, ship } = env;
        await env.pgrest.query("select adjust_stock($1, '42', 1)", [ASICS]); // la 42 est partie plus haut
        const { body } = await checkout([{ slug: ASICS, size: "42", qty: 1 }], "stripe", "colissimo");
        const id = body.order.id;
        // pas encore payée : refusé
        assertEquals((await ship("jeton-admin", { order: id })).res.status, 409);
        fakes.payStripe(([...fakes.sessions.values()].at(-1) as { id: string }).id);
        await confirm(id);

        assertEquals((await ship(null, { order: id })).res.status, 401, "sans connexion");
        assertEquals((await ship("jeton-inconnu", { order: id })).res.status, 401, "jeton invalide");
        assertEquals((await ship("jeton-visiteur", { order: id })).res.status, 403, "connecté mais pas admin");
        assertEquals(await status(id), "paid");
        assertEquals((await ship("jeton-admin", { order: id, tracking: "<script>" })).res.status, 400);

        const sent = fakes.mails.length;
        const r = await ship("jeton-admin", { order: id, tracking: "6A12345678901" });
        assertEquals(r.res.status, 200);
        assertEquals(r.res.headers.get("access-control-allow-origin"), ORIGIN);
        assertEquals([r.body.order.status, r.body.order.trackingNumber, r.body.email], [
          "shipped",
          "6A12345678901",
          "sent",
        ]);
        assertEquals(await status(id), "shipped");
        assertEquals(fakes.mails.length, sent + 1);
        const mail = fakes.mails.at(-1)!;
        assertEquals(mail.to, [{ email: CUSTOMER.email, name: "Camille Martin" }]);
        assertEquals(mail.sender, { email: "commandes@eliott-snkrs.fr", name: "Eliott SNKRS" });
        assertMatch(mail.subject, /^Ta commande ES-[0-9A-F]{8} est en route$/);
        assertMatch(mail.htmlContent, /laposte\.fr\/outils\/suivre-vos-envois\?code=6A12345678901/);
        assertMatch(mail.textContent, /Gel-Kayano 14 \(EU 42 · Neuf\)/);

        // cliqué deux fois : pas de second e-mail
        const again = await ship("jeton-admin", { order: id });
        assertEquals([again.body.order.trackingNumber, again.body.email], ["6A12345678901", "already_sent"]);
        assertEquals(fakes.mails.length, sent + 1);

        // annulé puis ré-expédié : toujours un seul e-mail
        const undo = await ship("jeton-admin", { order: id, shipped: false });
        assertEquals([undo.body.order.status, undo.body.email], ["paid", undefined]);
        assertEquals((await ship("jeton-admin", { order: id })).body.email, "already_sent");
        assertEquals(fakes.mails.length, sent + 1);
      });

      await t.step("expédition : Brevo en panne ou absent → expédiée quand même, l'admin est prévenu", async () => {
        const { fakes, ship } = env;
        const paidOrder = async () => {
          await env.pgrest.query("select adjust_stock($1, '43', 1)", [ASICS]);
          const { body } = await checkout([{ slug: ASICS, size: "43", qty: 1 }], "stripe");
          fakes.payStripe(([...fakes.sessions.values()].at(-1) as { id: string }).id);
          await confirm(body.order.id);
          return body.order.id as string;
        };
        const a = await paidOrder();
        fakes.brevoDown = true;
        const failed = await ship("jeton-admin", { order: a });
        fakes.brevoDown = false;
        assertEquals([failed.body.order.status, failed.body.email], ["shipped", "failed"]);
        // un nouvel essai envoie l'e-mail qui n'est pas parti
        assertEquals((await ship("jeton-admin", { order: a })).body.email, "sent");

        await env.pgrest.query("update orders set status = 'paid', shipped_email_at = null where id = $1", [a]);
        const saved = env.deps.mail;
        env.deps.mail = undefined;
        const off = await ship("jeton-admin", { order: a });
        env.deps.mail = saved;
        assertEquals([off.body.order.status, off.body.email], ["shipped", "not_configured"]);
      });

      await t.step("le navigateur ne peut pas lire les commandes", async () => {
        await env.pgrest.query("set role anon");
        assert((await env.pgrest.query("select count(*)::int n from orders")).rows[0].n === 0);
        await env.pgrest.query("reset role");
      });
    } finally {
      await env.pgrest.close();
    }
  },
});
