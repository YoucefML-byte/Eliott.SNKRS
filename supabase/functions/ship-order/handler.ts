// POST /functions/v1/ship-order  { order: "<uuid>", shipped?: boolean, tracking?: "6A123…" }
// Appelée par l'espace admin (Authorization : jeton de l'admin connecté) :
// marque la commande expédiée — ou annule l'expédition — et, la première fois,
// envoie à l'acheteur l'e-mail « Ta commande est en route ».

import { DbError, type OrderRow } from "../_shared/db.ts";
import type { Deps } from "../_shared/deps.ts";
import { corsHeaders, HttpError, json } from "../_shared/http.ts";
import { sendMail, shippedEmail } from "../_shared/mail.ts";
import { isUuid } from "../_shared/orders.ts";

/** sent : envoyé · already_sent : déjà envoyé avant · not_configured : Brevo absent · failed : refusé par Brevo */
export type EmailResult = "sent" | "already_sent" | "not_configured" | "failed";

const TRACKING = /^[A-Za-z0-9][A-Za-z0-9 -]{3,39}$/;

export async function handleShipOrder(req: Request, d: Deps): Promise<Response> {
  const cors = corsHeaders(req, d.origins);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, cors);

  try {
    const jwt = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const user = jwt ? await d.userFromToken(jwt) : null;
    if (!user) throw new HttpError(401, "unauthorized", "Session expirée : reconnecte-toi à l'espace admin.");

    const body = (await req.json().catch(() => ({}))) as { order?: unknown; shipped?: unknown; tracking?: unknown };
    if (!isUuid(body.order)) throw new HttpError(400, "invalid_request", "Commande inconnue.");
    const shipped = body.shipped !== false;
    const tracking = typeof body.tracking === "string" ? body.tracking.trim() : "";
    if (tracking && !TRACKING.test(tracking)) {
      throw new HttpError(400, "invalid_tracking", "Numéro de suivi invalide : lettres et chiffres uniquement.");
    }

    let order: OrderRow;
    try {
      order = await d.db.markShipped(user, body.order, shipped, tracking);
    } catch (e) {
      if (e instanceof DbError && e.code === "forbidden") {
        throw new HttpError(403, "forbidden", "Ce compte n'a pas accès aux commandes.");
      }
      if (e instanceof DbError && e.code === "unknown_order") {
        throw new HttpError(404, "not_found", "Commande introuvable.");
      }
      if (e instanceof DbError && e.code === "invalid_status") {
        throw new HttpError(409, "invalid_status", "Cette commande n'est pas payée : elle ne peut pas être expédiée.");
      }
      throw e;
    }

    let email: EmailResult | undefined;
    if (shipped) {
      if (order.shipped_email_at) email = "already_sent";
      else if (!d.mail) email = "not_configured";
      else {
        try {
          const c = order.customer;
          await sendMail(d.fetch, d.mail, {
            to: { email: c.email, name: `${c.firstName} ${c.lastName}` },
            ...shippedEmail(order, d.siteUrl),
          });
          await d.db.markShippingEmailSent(order.id);
          email = "sent";
        } catch (e) {
          console.error(e);
          email = "failed";
        }
      }
    }

    return json(
      {
        order: {
          id: order.id,
          status: order.status,
          trackingNumber: order.tracking_number ?? null,
          shippedAt: order.shipped_at ?? null,
        },
        email,
      },
      200,
      cors,
    );
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.code, message: e.message }, e.status, cors);
    console.error(e);
    return json({ error: "server_error", message: "Mise à jour impossible. Réessaie dans un instant." }, 500, cors);
  }
}
