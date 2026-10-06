import { depsFromEnv } from "../_shared/deps.ts";
import { handleConfirmOrder } from "./handler.ts";

const deps = depsFromEnv();
Deno.serve((req) => handleConfirmOrder(req, deps));
