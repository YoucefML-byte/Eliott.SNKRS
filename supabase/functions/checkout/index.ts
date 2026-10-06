import { depsFromEnv } from "../_shared/deps.ts";
import { handleCheckout } from "./handler.ts";

const deps = depsFromEnv();
Deno.serve((req) => handleCheckout(req, deps));
