import { z } from "zod";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { getHomeRankingConfig, updateHomeRankingConfig } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

const homeRankingConfigSchema = z.object({
  trending: z.object({
    recentQuantityWeight: z.number().finite(),
    recentOrdersWeight: z.number().finite(),
    ratingWeight: z.number().finite(),
    reviewsWeight: z.number().finite(),
    offerWeight: z.number().finite(),
    featuredBoost: z.number().finite(),
  }),
  bestSellers: z.object({
    totalQuantityWeight: z.number().finite(),
    totalOrdersWeight: z.number().finite(),
    revenueWeight: z.number().finite(),
    ratingWeight: z.number().finite(),
    reviewsWeight: z.number().finite(),
  }),
  signaturePicks: z.object({
    premiumSignalWeight: z.number().finite(),
    qualityWeight: z.number().finite(),
    discountWeight: z.number().finite(),
    trustWeight: z.number().finite(),
    demandWeight: z.number().finite(),
    signaturePriceThreshold: z.number().finite(),
    highPriceThreshold: z.number().finite(),
  }),
});

export async function GET(request: Request) {
  try {
    const identity = await authorizeAdminRequest(request, "settings");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const config = await getHomeRankingConfig();
    return ok(config);
  } catch (error) {
    return serverError("Unable to fetch home ranking config", error);
  }
}

export async function PATCH(request: Request) {
  try {
    const identity = await authorizeAdminRequest(request, "settings");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const body = (await request.json().catch(() => ({}))) as unknown;
    const parsed = homeRankingConfigSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid home ranking config payload", parsed.error.flatten());
    }

    const config = await updateHomeRankingConfig({
      config: parsed.data,
      updatedBy: identity.userId,
    });

    return ok(config);
  } catch (error) {
    return serverError("Unable to update home ranking config", error);
  }
}
