import { getHomeData } from "@/lib/server/ecommerce-service";
import { ok, serverError } from "@/lib/api-response";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getHomeData();
    return ok(data);
  } catch (error) {
    return serverError("Unable to fetch home data", error);
  }
}
