// Petites aides HTTP communes aux fonctions.

export type Fetch = typeof fetch;

/** Origines autorisées à appeler les fonctions depuis le navigateur. */
export function allowedOrigins(siteUrl: string, extra = ""): string[] {
  const list = [siteUrl, ...extra.split(",")].map((s) => s.trim()).filter(Boolean);
  return [...new Set(list.map((s) => new URL(s).origin))];
}

export function corsHeaders(req: Request, origins: string[]): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  if (!origins.includes(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
    "access-control-max-age": "86400",
    vary: "origin",
  };
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

/** Erreur prévue, renvoyée telle quelle au navigateur. */
export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Variable d'environnement manquante : ${name}`);
  return v;
}
