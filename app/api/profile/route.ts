import { auth } from "@/auth";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/api-response";
import { profileUpdateSchema } from "@/lib/server/api-schemas";
import { getProfile, upsertProfile } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return unauthorized("Sign in required");
    }

    const profile = await getProfile(userId);
    if (!profile) {
      return notFound("Profile not found. Seed data first from /api/dev/seed.");
    }
    return ok(profile);
  } catch (error) {
    return serverError("Unable to fetch profile", error);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

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
        email: parsed.data.email ?? session?.user?.email ?? undefined,
      },
      userId,
    );
    return ok(updated);
  } catch (error) {
    return serverError("Unable to update profile", error);
  }
}
