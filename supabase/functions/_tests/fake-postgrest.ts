// Mini-PostgREST pour les tests d'intégration : traduit les quelques appels
// REST de _shared/db.ts en SQL sur un vrai PostgreSQL, en tant que
// service_role — exactement les droits qu'ont les fonctions en production.

import pg from "pg";

export async function fakePostgrest(databaseUrl: string, serviceKey: string) {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  let queue = Promise.resolve();
  type Rows = { rows: { j: unknown }[] };
  const asService = (fn: () => Promise<Rows>): Promise<Rows> => {
    const run = queue.then(async () => {
      await client.query("begin; set local role service_role");
      try {
        const r = await fn();
        await client.query("commit");
        return r;
      } catch (e) {
        await client.query("rollback");
        throw e;
      }
    });
    queue = run.then(() => {}, () => {});
    return run;
  };

  const server = Deno.serve({ port: 0, onListen() {} }, async (req) => {
    if (req.headers.get("apikey") !== serviceKey) return Response.json({ message: "Invalid API key" }, { status: 401 });
    const url = new URL(req.url);
    const body = req.method === "GET" ? null : await req.text().then((t) => (t ? JSON.parse(t) : null));
    try {
      const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/(\w+)$/)?.[1];
      if (rpc) {
        const keys = Object.keys(body ?? {});
        const args = keys.map((k, i) => `${k} => $${i + 1}`).join(", ");
        const values = keys.map((
          k,
        ) => (typeof body[k] === "object" && body[k] !== null ? JSON.stringify(body[k]) : body[k]));
        const ret = await client.query("select prorettype::regtype::text as t from pg_proc where proname = $1", [rpc]);
        if (ret.rows[0]?.t === "void") {
          await asService(() => client.query(`select public.${rpc}(${args})`, values));
          return new Response(null, { status: 204 });
        }
        const r = await asService(() => client.query(`select to_jsonb(t) as j from public.${rpc}(${args}) t`, values));
        return Response.json(r.rows[0]?.j ?? null);
      }
      if (url.pathname === "/rest/v1/orders") {
        const id = url.searchParams.get("id")?.replace(/^eq\./, "");
        if (req.method === "GET") {
          const r = await asService(() =>
            client.query("select to_jsonb(o) as j from public.orders o where id = $1", [id])
          );
          return Response.json(r.rows.map((x) => x.j));
        }
        if (req.method === "PATCH") {
          await asService(() =>
            client.query("update public.orders set provider_ref = $2 where id = $1", [id, body.provider_ref])
          );
          return new Response(null, { status: 204 });
        }
      }
      return Response.json({ message: "not found" }, { status: 404 });
    } catch (e) {
      return Response.json({ message: (e as Error).message }, { status: 400 });
    }
  });

  return {
    url: `http://localhost:${server.addr.port}`,
    query: (sql: string, params?: unknown[]) => client.query(sql, params),
    async close() {
      await server.shutdown();
      await client.end();
    },
  };
}
