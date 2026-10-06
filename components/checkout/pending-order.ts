// Dernière commande envoyée vers Stripe / PayPal depuis ce navigateur, pour
// libérer ses paires si le client revient en arrière et recommence, et ses
// coordonnées (le temps de l'onglet) pour ne pas les ressaisir.

const KEY = "eliott-pending-order-v1";
const DETAILS = "eliott-checkout-v1";

export function saveDetails(details: Record<string, string>) {
  try {
    sessionStorage.setItem(DETAILS, JSON.stringify(details));
  } catch {
    // stockage indisponible
  }
}

export function savedDetails(): Record<string, string> | null {
  try {
    return JSON.parse(sessionStorage.getItem(DETAILS) ?? "null");
  } catch {
    return null;
  }
}

export function pendingOrder(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function rememberPendingOrder(id: string) {
  try {
    sessionStorage.setItem(KEY, id);
  } catch {
    // navigation privée : la réservation expirera d'elle-même
  }
}

export function forgetPendingOrder(id?: string, paid = false) {
  try {
    if (!id || sessionStorage.getItem(KEY) === id) sessionStorage.removeItem(KEY);
    if (paid) sessionStorage.removeItem(DETAILS);
  } catch {
    // rien à faire
  }
}
