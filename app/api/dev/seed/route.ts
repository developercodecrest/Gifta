import { fail, ok, serverError } from "@/lib/api-response";
import { seedDemoData } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return fail(403, {
      code: "FORBIDDEN",
      message: "Seed endpoint is disabled in production.",
    });
  }

  try {
    const result = await seedDemoData();
    return ok(result);
  } catch (error) {
    return serverError("Unable to seed demo data", error);
  }
}
