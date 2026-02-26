import { ok, serverError } from "@/lib/api-response";
import { listStores } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const stores = await listStores();
    return ok(stores);
  } catch (error) {
    return serverError("Unable to fetch stores", error);
  }
}
