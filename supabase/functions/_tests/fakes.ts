// Faux Stripe et faux PayPal (aucun appel réseau) pour les tests.

export interface Call {
  method: string;
  url: string;
  headers: Headers;
  body: string;
}

const ok = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export function fakeProviders(passthrough: typeof fetch = fetch) {
  const calls: Call[] = [];
  const sessions = new Map<string, Record<string, unknown>>();
  const byIdem = new Map<string, string>();
  // deno-lint-ignore no-explicit-any -- faux objets PayPal, structure libre
  const paypalOrders = new Map<string, Record<string, any>>();
  let n = 0;
  let stripeDown = false;
  let captureAmountOverride: string | null = null;

  // deno-lint-ignore require-await
  const fetchFn: typeof fetch = async (input, init = {}) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const method = (init.method ?? "GET").toUpperCase();
    const headers = new Headers(init.headers);
    const body = init.body == null ? "" : String(init.body);

    if (url.hostname === "api.stripe.com") {
      calls.push({ method, url: url.href, headers, body });
      if (stripeDown) return ok({ error: { message: "API indisponible" } }, 500);
      if (!headers.get("authorization")?.startsWith("Bearer sk_test_")) {
        return ok({ error: { message: "bad key" } }, 401);
      }
      const m = url.pathname.match(/^\/v1\/checkout\/sessions(?:\/([^/]+))?(\/expire)?$/);
      if (!m) return ok({ error: { message: "not found" } }, 404);
      if (!m[1] && method === "POST") {
        const idem = headers.get("idempotency-key") ?? "";
        if (byIdem.has(idem)) return ok(sessions.get(byIdem.get(idem)!));
        const p = new URLSearchParams(body);
        let amount = Number(p.get("shipping_options[0][shipping_rate_data][fixed_amount][amount]"));
        for (let i = 0; p.has(`line_items[${i}][quantity]`); i++) {
          amount += Number(p.get(`line_items[${i}][quantity]`)) *
            Number(p.get(`line_items[${i}][price_data][unit_amount]`));
        }
        const id = `cs_test_${++n}`;
        const s = {
          id,
          url: `https://checkout.stripe.com/c/pay/${id}`,
          status: "open",
          payment_status: "unpaid",
          client_reference_id: p.get("client_reference_id"),
          metadata: { order_id: p.get("metadata[order_id]"), order_number: p.get("metadata[order_number]") },
          amount_total: amount,
          params: Object.fromEntries(p),
        };
        sessions.set(id, s);
        byIdem.set(idem, id);
        return ok(s);
      }
      const s = sessions.get(m[1]);
      if (!s) return ok({ error: { message: "No such checkout.session" } }, 404);
      if (m[2]) {
        if (s.status !== "open") return ok({ error: { message: "not open" } }, 400);
        s.status = "expired";
      }
      return ok(s);
    }

    if (url.hostname === "api-m.sandbox.paypal.com") {
      calls.push({ method, url: url.href, headers, body });
      if (url.pathname === "/v1/oauth2/token") {
        return headers.get("authorization") === `Basic ${btoa("pp-id:pp-secret")}`
          ? ok({ access_token: "A21-token" })
          : ok({ error: "invalid_client" }, 401);
      }
      if (headers.get("authorization") !== "Bearer A21-token") return ok({ name: "AUTHENTICATION_FAILURE" }, 401);
      const m = url.pathname.match(/^\/v2\/checkout\/orders(?:\/([^/]+))?(\/capture)?$/);
      if (!m) return ok({}, 404);
      if (!m[1]) {
        const id = `PP${++n}`;
        const o = { id, status: "PAYER_ACTION_REQUIRED", body: JSON.parse(body) };
        paypalOrders.set(id, o);
        return ok({
          id,
          status: o.status,
          links: [{ rel: "payer-action", href: `https://www.sandbox.paypal.com/checkoutnow?token=${id}` }],
        });
      }
      const o = paypalOrders.get(m[1]);
      if (!o) return ok({ name: "RESOURCE_NOT_FOUND" }, 404);
      if (m[2]) {
        if (o.status === "COMPLETED") {
          return ok({ name: "UNPROCESSABLE_ENTITY", details: [{ issue: "ORDER_ALREADY_CAPTURED" }] }, 422);
        }
        if (o.status !== "APPROVED") {
          return ok({ name: "UNPROCESSABLE_ENTITY", details: [{ issue: "ORDER_NOT_APPROVED" }] }, 422);
        }
        const amount = { ...o.body.purchase_units[0].amount };
        delete amount.breakdown;
        if (captureAmountOverride) amount.value = captureAmountOverride;
        o.status = "COMPLETED";
        o.purchase_units = [{ payments: { captures: [{ id: `CAP${++n}`, status: "COMPLETED", amount }] } }];
      }
      return ok({ id: o.id, status: o.status, purchase_units: o.purchase_units });
    }

    return passthrough(input, init);
  };

  return {
    fetch: fetchFn,
    calls,
    sessions,
    paypalOrders,
    /** le client paie sur la page Stripe */
    payStripe(id: string) {
      Object.assign(sessions.get(id)!, { status: "complete", payment_status: "paid" });
      return sessions.get(id)!;
    },
    /** le client valide chez PayPal */
    approvePaypal(id: string) {
      paypalOrders.get(id)!.status = "APPROVED";
    },
    set stripeDown(v: boolean) {
      stripeDown = v;
    },
    set captureAmount(v: string | null) {
      captureAmountOverride = v;
    },
  };
}
