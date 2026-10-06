import { DbError } from "./db.ts";
import { HttpError, json } from "./http.ts";
import { orderErrorMessage } from "./orders.ts";

export function errorResponse(e: unknown, headers: Record<string, string>) {
  if (e instanceof DbError && e.code !== "unknown_order") {
    const status = e.code.startsWith("invalid_") ? 400 : 409;
    return json({ error: e.code, message: orderErrorMessage(e.code) }, status, headers);
  }
  if (e instanceof HttpError) return json({ error: e.code, message: e.message }, e.status, headers);
  console.error(e);
  return json(
    { error: "server_error", message: "Le paiement est momentanément indisponible. Réessaie dans un instant." },
    500,
    headers,
  );
}
