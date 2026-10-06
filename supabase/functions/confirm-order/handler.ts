// POST /functions/v1/confirm-order  { order: "<uuid>", action?: "confirm" | "cancel" }
// Appelée par la page de confirmation au retour de Stripe / PayPal :
// - Stripe : vérifie la session auprès de Stripe (au cas où le webhook tarde) ;
// - PayPal : encaisse le paiement que le client vient de valider ;
// - « cancel » : le client est revenu sans payer, on libère ses paires.
// L'identifiant de commande (UUID aléatoire) n'est connu que de l'acheteur.

import type { Deps } from "../_shared/deps.ts";
import type { OrderRow } from "../_shared/db.ts";
import { corsHeaders, HttpError, json } from "../_shared/http.ts";
import { isUuid, publicOrder } from "../_shared/orders.ts";
import { capturePaypalOrder } from "../_shared/paypal.ts";
import { errorResponse } from "../_shared/respond.ts";
import { expireCheckoutSession, retrieveCheckoutSession } from "../_shared/stripe.ts";

type Notice = "declined" | "expired" | undefined;

export async function handleConfirmOrder(req: Request, d: Deps): Promise<Response> {
  const cors = corsHeaders(req, d.origins);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, cors);

  try {
    const body = (await req.json().catch(() => ({}))) as { order?: unknown; action?: unknown };
    if (!isUuid(body.order)) throw new HttpError(400, "invalid_request", "Commande inconnue.");
    let order = await d.db.getOrder(body.order);
    if (!order) throw new HttpError(404, "not_found", "Commande introuvable.");

    if (body.action === "cancel") {
      if (order.status === "pending") {
        if (order.provider === "stripe" && order.provider_ref && d.stripeKey) {
          await expireCheckoutSession(d.fetch, d.stripeKey, order.provider_ref);
        }
        await d.db.cancel(order.id);
        order = (await d.db.getOrder(order.id))!;
      }
      return json({ order: publicOrder(order) }, 200, cors);
    }

    let notice: Notice;
    [order, notice] = await confirm(order, d);
    return json({ order: publicOrder(order), notice }, 200, cors);
  } catch (e) {
    return errorResponse(e, cors);
  }
}

async function confirm(order: OrderRow, d: Deps): Promise<[OrderRow, Notice]> {
  if (!order.provider_ref || (order.status !== "pending" && order.status !== "cancelled")) return [order, undefined];

  if (order.provider === "stripe" && d.stripeKey) {
    const s = await retrieveCheckoutSession(d.fetch, d.stripeKey, order.provider_ref);
    if (s.payment_status === "paid" && (s.metadata?.order_id ?? s.client_reference_id) === order.id) {
      return [await d.db.markPaid(order.id, s.id), undefined];
    }
    return [order, order.status === "cancelled" ? "expired" : undefined];
  }

  if (order.provider === "paypal" && d.paypal) {
    // réservation expirée : on n'encaisse pas, rien n'est débité
    if (order.status === "cancelled") return [order, "expired"];
    const r = await capturePaypalOrder(d.fetch, d.paypal, order.provider_ref, order);
    if (r.state === "paid") return [await d.db.markPaid(order.id, r.captureId), undefined];
    return [order, r.state === "declined" ? "declined" : undefined];
  }
  return [order, undefined];
}
