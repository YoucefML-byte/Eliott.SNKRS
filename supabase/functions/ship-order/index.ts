import { depsFromEnv } from "../_shared/deps.ts";
import { handleShipOrder } from "./handler.ts";

const deps = depsFromEnv();
Deno.serve((req) => handleShipOrder(req, deps));
