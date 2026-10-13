// Ce dont les fonctions ont besoin, lu dans les secrets du projet Supabase
// (Edge Functions → Secrets). Injecté en paramètre pour pouvoir tester.

import { type Db, restDb } from "./db.ts";
import { allowedOrigins, env, type Fetch } from "./http.ts";
import type { MailConfig } from "./mail.ts";
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
  /** e-mails aux acheteurs (Brevo) ; absent : rien n'est envoyé */
  mail?: MailConfig;
  /** identifiant de l'utilisateur connecté à qui appartient ce jeton, ou null */
  userFromToken: (jwt: string) => Promise<string | null>;
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
    mail: get("BREVO_API_KEY") && get("MAIL_FROM")
      ? {
        apiKey: get("BREVO_API_KEY")!,
        from: get("MAIL_FROM")!,
        fromName: get("MAIL_FROM_NAME") ?? "Eliott SNKRS",
        replyTo: get("MAIL_REPLY_TO"),
      }
      : undefined,
    userFromToken: (jwt) => supabaseUser(fetch, env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), jwt),
    nowSec: () => Math.floor(Date.now() / 1000),
  };
}

/** Vérifie un jeton de connexion auprès de Supabase Auth. */
export async function supabaseUser(fetchFn: Fetch, url: string, key: string, jwt: string): Promise<string | null> {
  const res = await fetchFn(`${url.replace(/\/$/, "")}/auth/v1/user`, {
    headers: { apikey: key, authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) return null;
  const user = (await res.json().catch(() => null)) as { id?: string } | null;
  return user?.id ?? null;
}

/** Pages du site où Stripe / PayPal renvoient le client. */
export const returnUrls = (siteUrl: string, orderId: string) => ({
  success: `${siteUrl}/checkout/confirmation/?commande=${orderId}`,
  cancel: `${siteUrl}/checkout/?annulee=${orderId}`,
});
