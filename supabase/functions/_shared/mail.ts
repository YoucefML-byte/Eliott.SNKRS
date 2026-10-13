// E-mails envoyés aux acheteurs, via l'API de Brevo (https://www.brevo.com,
// gratuit jusqu'à 300 e-mails par jour). L'expéditeur (MAIL_FROM) doit être
// validé dans Brevo : Senders, Domains & Dedicated IPs → Senders.

import type { OrderRow } from "./db.ts";
import type { Fetch } from "./http.ts";
import { conditionLabel } from "./orders.ts";

export interface MailConfig {
  apiKey: string;
  /** adresse d'expédition validée dans Brevo */
  from: string;
  fromName: string;
  /** adresse qui reçoit les réponses des clients (sinon : from) */
  replyTo?: string;
}

export interface Mail {
  to: { email: string; name: string };
  subject: string;
  html: string;
  text: string;
}

export async function sendMail(fetchFn: Fetch, cfg: MailConfig, m: Mail): Promise<void> {
  const res = await fetchFn("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": cfg.apiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { email: cfg.from, name: cfg.fromName },
      to: [m.to],
      ...(cfg.replyTo ? { replyTo: { email: cfg.replyTo } } : {}),
      subject: m.subject,
      htmlContent: m.html,
      textContent: m.text,
    }),
  });
  if (!res.ok) throw new Error(`Brevo ${res.status} : ${await res.text()}`);
}

/** transporteur, délai indicatif et page de suivi de chaque mode de livraison */
const CARRIERS: Record<string, { carrier: string; delay: string; track: (n: string, zip: string) => string }> = {
  relais: {
    carrier: "Mondial Relay",
    delay: "3 à 5 jours ouvrés",
    track: (n, zip) =>
      `https://www.mondialrelay.fr/suivi-de-colis/?NumeroExpedition=${encodeURIComponent(n)}&CodePostal=${
        encodeURIComponent(zip)
      }`,
  },
  colissimo: {
    carrier: "Colissimo",
    delay: "48 h environ",
    track: (n) => `https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(n)}`,
  },
  express: {
    carrier: "Chronopost",
    delay: "24 h environ",
    track: (n) => `https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=${encodeURIComponent(n)}`,
  },
};

export const trackingUrl = (o: Pick<OrderRow, "shipping_method" | "tracking_number" | "customer">) =>
  o.tracking_number ? CARRIERS[o.shipping_method]?.track(o.tracking_number, o.customer.zip) ?? null : null;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const size = (s: string) => (s === "TU" ? "Taille unique" : `EU ${s}`);

/** « Ta commande est en route » : envoyé quand l'admin marque la commande expédiée. */
export function shippedEmail(o: OrderRow, siteUrl: string, instagram = "eliott.snkrs"): Omit<Mail, "to"> {
  const c = o.customer;
  const ship = CARRIERS[o.shipping_method];
  const url = trackingUrl(o);
  const lines = o.items.map((i) => ({
    name: i.name,
    detail: [size(i.size), i.condition && conditionLabel(i.condition)].filter(Boolean).join(" · "),
    qty: i.qty,
  }));
  const subject = `Ta commande ${o.number} est en route`;

  const text = [
    `Bonne nouvelle ${c.firstName} !`,
    "",
    `Ta commande ${o.number} vient d'être expédiée${
      ship ? ` avec ${ship.carrier} (délai indicatif : ${ship.delay})` : ""
    }.`,
    o.tracking_number ? `Numéro de suivi : ${o.tracking_number}` : "",
    url ? `Suivre le colis : ${url}` : "",
    "",
    "Dans le colis :",
    ...lines.map((l) => `- ${l.qty > 1 ? `${l.qty} × ` : ""}${l.name} (${l.detail})`),
    "",
    "Livraison à :",
    `${c.firstName} ${c.lastName}`,
    c.address,
    `${c.zip} ${c.city}`,
    "",
    `Une question ? Réponds simplement à cet e-mail ou écris-nous sur Instagram @${instagram}.`,
    "",
    "Eliott SNKRS",
    siteUrl,
  ].filter((l, i, all) => l !== "" || all[i - 1] !== "").join("\n");

  const row = (l: (typeof lines)[number]) => `
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #e6e6e6">
              <div style="font-weight:700;color:#0b0b0b">${l.qty > 1 ? `${l.qty} × ` : ""}${esc(l.name)}</div>
              <div style="color:#555;font-size:14px">${esc(l.detail)}</div>
            </td>
          </tr>`;

  const html = `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(subject)}</title></head>
<body style="margin:0;background:#f0f0f0;font-family:Inter,'Helvetica Neue',Arial,sans-serif;color:#0b0b0b">
  <div style="display:none;max-height:0;overflow:hidden">Ta commande ${esc(o.number)} a quitté l'atelier.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden">
        <tr><td style="background:#0b0b0b;padding:20px 28px;font-size:22px;font-weight:800;color:#ffffff">eliott<span style="color:#00fc54">.</span>snkrs</td></tr>
        <tr><td style="padding:32px 28px 8px">
          <h1 style="margin:0 0 12px;font-size:26px;line-height:1.15;font-weight:800">Ta commande est en route</h1>
          <p style="margin:0;font-size:16px;line-height:1.5">Bonne nouvelle ${esc(c.firstName)} ! Ta commande <b>${
    esc(o.number)
  }</b> vient d'être expédiée${ship ? ` avec <b>${ship.carrier}</b> (délai indicatif : ${ship.delay})` : ""}.</p>
        </td></tr>
        ${
    o.tracking_number
      ? `<tr><td style="padding:20px 28px 4px">
          <p style="margin:0 0 12px;font-size:15px">Numéro de suivi : <b style="font-family:Menlo,Consolas,monospace">${
        esc(o.tracking_number)
      }</b></p>
          ${
        url
          ? `<a href="${
            esc(url)
          }" style="display:inline-block;background:#00fc54;color:#0b0b0b;font-weight:800;text-decoration:none;padding:14px 22px;border-radius:6px;text-transform:uppercase;letter-spacing:.06em;font-size:14px">Suivre mon colis</a>`
          : ""
      }
        </td></tr>`
      : ""
  }
        <tr><td style="padding:24px 28px 0">
          <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#777">Dans le colis</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${lines.map(row).join("")}
          </table>
        </td></tr>
        <tr><td style="padding:20px 28px 0;font-size:15px;line-height:1.5">
          <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#777">Livraison à</div>
          ${esc(`${c.firstName} ${c.lastName}`)}<br>${esc(c.address)}<br>${esc(`${c.zip} ${c.city}`)}
        </td></tr>
        <tr><td style="padding:28px 28px 32px;font-size:14px;line-height:1.5;color:#555">
          Une question ? Réponds simplement à cet e-mail ou écris-nous sur Instagram
          <a href="https://instagram.com/${esc(instagram)}" style="color:#0b0b0b">@${esc(instagram)}</a>.<br><br>
          <a href="${esc(siteUrl)}" style="color:#0b0b0b;font-weight:700">Eliott SNKRS</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
