// POST /functions/v1/stripe-webhook — appelée par Stripe (jamais par le site).
// À déclarer dans Stripe → Développeurs → Webhooks, événements :
// checkout.session.completed, checkout.session.async_payment_succeeded,
// checkout.session.async_payment_failed, checkout.session.expired.

import { DbError } from "../_shared/db.ts";
import type { Deps } from "../_shared/deps.ts";
import { json } from "../_shared/http.ts";
import { isUuid } from "../_shared/orders.ts";
import { verifyStripeSignature } from "../_shared/stripe.ts";

export async function handleStripeWebhook(req: Request, d: Deps): Promise<Response> {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!d.stripeWebhookSecret) return json({ error: "not_configured" }, 503);

  const payload = await req.text();
  const ok = await verifyStripeSignature(
    payload,
    req.headers.get("stripe-signature"),
    d.stripeWebhookSecret,
    d.nowSec(),
  );
  if (!ok) return json({ error: "invalid_signature" }, 400);

  const event = JSON.parse(payload);
  const session = event?.data?.object ?? {};
  const orderId = session.metadata?.order_id ?? session.client_reference_id;
  if (!isUuid(orderId)) return json({ received: true, ignored: true });

  try {
    switch (event.type) {
      case "checkout.session.completed":
        if (session.payment_status === "paid") await d.db.markPaid(orderId, session.id);
        break;
      case "checkout.session.async_payment_succeeded":
        await d.db.markPaid(orderId, session.id);
        break;
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed":
        await d.db.cancel(orderId);
        break;
    }
  } catch (e) {
    // commande inconnue (ex. événement de test) : rien à faire
    if (e instanceof DbError && e.code === "unknown_order") return json({ received: true, ignored: true });
    console.error(e);
    return json({ error: "server_error" }, 500); // Stripe réessaiera
  }
  return json({ received: true });
}
