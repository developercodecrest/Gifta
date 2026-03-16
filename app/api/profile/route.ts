import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { categories } from "@/lib/catalog";
import { getProfile, upsertProfile } from "@/lib/server/ecommerce-service";
import { resolveRequestIdentity } from "@/lib/server/request-auth";
import { z } from "zod";

export const runtime = "nodejs";

const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  profileImage: z.string().trim().url().optional(),
  preferences: z
    .object({
      occasions: z.array(z.enum(categories)).optional(),
      budgetMin: z.number().min(0).optional(),
      budgetMax: z.number().min(0).optional(),
      preferredTags: z.array(z.string().trim().min(1)).optional(),
    })
    .optional(),
  addresses: z
    .array(
      z.object({
        label: z.string().trim().min(1),
        receiverName: z.string().trim().min(2),
        receiverPhone: z.string().trim().min(7).max(20),
        line1: z.string().trim().min(1),
        city: z.string().trim().min(1),
        state: z.string().trim().min(1),
        pinCode: z.string().trim().min(3),
        country: z.string().trim().min(2),
      }),
    )
    .optional(),
});

export async function GET(request: Request) {
  try {
    const identity = await resolveRequestIdentity(request);
    const userId = identity?.userId;

    if (!userId) {
      return unauthorized("Sign in required");
    }

    const profile = await getProfile(userId);
    if (profile) {
      return ok(profile);
    }

    const initialized = await upsertProfile({}, userId);
    return ok(initialized);
  } catch (error) {
    return serverError("Unable to fetch profile", error);
  }
}

export async function PUT(request: Request) {
  try {
    const identity = await resolveRequestIdentity(request);
    const userId = identity?.userId;

    if (!userId) {
      return unauthorized("Sign in required");
    }

    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid profile payload", parsed.error.flatten());
    }

    const updated = await upsertProfile(
      {
        ...parsed.data,
        email: parsed.data.email ?? identity?.email ?? undefined,
      },
      userId,
    );
    return ok(updated);
  } catch (error) {
    return serverError("Unable to update profile", error);
  }
}
