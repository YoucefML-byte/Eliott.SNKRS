// Ce dont les fonctions ont besoin, lu dans les secrets du projet Supabase
// (Edge Functions → Secrets). Injecté en paramètre pour pouvoir tester.

import { type Db, restDb } from "./db.ts";
import { allowedOrigins, env, type Fetch } from "./http.ts";
import type { PaypalConfig } from "./paypal.ts";

export interface Deps {
  db: Db;
  fetch: Fetch;
  /** adresse publique du site, ex. https://eliott-snkrs.fr */
  siteUrl: string;
  origins: string[];
  stripeKey?: string;
  stripeWebhookSecret?: string;
  paypal?: PaypalConfig;
  nowSec: () => number;
}

export function depsFromEnv(): Deps {
  const siteUrl = env("SITE_URL").replace(/\/$/, "");
  const get = (k: string) => Deno.env.get(k) || undefined;
  const paypalId = get("PAYPAL_CLIENT_ID");
  const paypalSecret = get("PAYPAL_SECRET");
  return {
    // SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement par Supabase
    db: restDb(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY")),
    fetch,
    siteUrl,
    origins: allowedOrigins(siteUrl, get("ALLOWED_ORIGINS")),
    stripeKey: get("STRIPE_SECRET_KEY"),
    stripeWebhookSecret: get("STRIPE_WEBHOOK_SECRET"),
    paypal: paypalId && paypalSecret
      ? { clientId: paypalId, secret: paypalSecret, env: get("PAYPAL_ENV") ?? "sandbox" }
      : undefined,
    nowSec: () => Math.floor(Date.now() / 1000),
  };
}

/** Pages du site où Stripe / PayPal renvoient le client. */
export const returnUrls = (siteUrl: string, orderId: string) => ({
  success: `${siteUrl}/checkout/confirmation/?commande=${orderId}`,
  cancel: `${siteUrl}/checkout/?annulee=${orderId}`,
});
