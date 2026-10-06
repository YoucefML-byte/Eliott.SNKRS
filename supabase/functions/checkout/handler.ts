// POST /functions/v1/checkout
// { items: [{ slug, size, qty }], customer: {...}, shipping, provider: "stripe" | "paypal" }
// → crée la commande (prix lus en base, paires réservées 30 min) puis la page de
//   paiement Stripe ou PayPal, et renvoie { order: { id, number }, url }.

import type { Deps } from "../_shared/deps.ts";
import { returnUrls } from "../_shared/deps.ts";
import { corsHeaders, HttpError, json } from "../_shared/http.ts";
import { parseCheckout } from "../_shared/orders.ts";
import { createPaypalOrder } from "../_shared/paypal.ts";
import { errorResponse } from "../_shared/respond.ts";
import { createCheckoutSession } from "../_shared/stripe.ts";

export async function handleCheckout(req: Request, d: Deps): Promise<Response> {
  const cors = corsHeaders(req, d.origins);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, cors);

  try {
    const input = parseCheckout(await req.json().catch(() => null));
    if ((input.provider === "stripe" && !d.stripeKey) || (input.provider === "paypal" && !d.paypal)) {
      throw new HttpError(503, "provider_unavailable", "Ce moyen de paiement n'est pas encore disponible.");
    }

    const order = await d.db.createOrder(input.items, input.customer, input.shipping, input.provider);
    const urls = returnUrls(d.siteUrl, order.id);
    try {
      const pay = input.provider === "stripe"
        ? await createCheckoutSession(d.fetch, d.stripeKey!, order, urls, d.nowSec())
        : await createPaypalOrder(d.fetch, d.paypal!, order, urls);
      if (!pay.url) throw new Error("lien de paiement manquant");
      await d.db.setProviderRef(order.id, pay.id);
      return json({ order: { id: order.id, number: order.number }, url: pay.url }, 200, cors);
    } catch (e) {
      // la page de paiement n'a pas pu être créée : on libère les paires tout de suite
      await d.db.cancel(order.id).catch(() => {});
      throw e;
    }
  } catch (e) {
    return errorResponse(e, cors);
  }
}
