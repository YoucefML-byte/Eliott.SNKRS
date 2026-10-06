import { depsFromEnv } from "../_shared/deps.ts";
import { handleStripeWebhook } from "./handler.ts";

const deps = depsFromEnv();
Deno.serve((req) => handleStripeWebhook(req, deps));
