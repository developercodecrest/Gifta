import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { deleteAdminUser, updateAdminUser } from "@/lib/server/ecommerce-service";
import { getAuthUserById } from "@/lib/server/otp-service";
import { parseRole } from "@/lib/roles";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const identity = await authorizeAdminRequest(request, "users");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const { id } = await context.params;
    const user = await getAuthUserById(id);
    if (!user) {
      return badRequest("User not found");
    }

    return ok({
      userId: user._id?.toString() ?? id,
      fullName: user.fullName ?? "Gifta User",
      email: user.email,
      phone: user.phone,
      profileImage: user.image ?? undefined,
      addresses: user.addresses ?? [],
      preferences: user.preferences,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    return serverError("Unable to fetch user", error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const identity = await authorizeAdminRequest(request, "users");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      fullName?: string;
      phone?: string;
      role?: string;
      email?: string;
    };

    if (
      typeof body.fullName !== "string" &&
      typeof body.phone !== "string" &&
      typeof body.role !== "string" &&
      typeof body.email !== "string"
    ) {
      return badRequest("Provide at least one valid field to update");
    }

    const updated = await updateAdminUser({
      userId: id,
      updates: {
        fullName: body.fullName,
        phone: body.phone,
        email: body.email,
        role: body.role ? parseRole(body.role) : undefined,
      },
    });

    return ok(updated);
  } catch (error) {
    return serverError("Unable to update user", error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const identity = await authorizeAdminRequest(request, "users");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const { id } = await context.params;
    const result = await deleteAdminUser(id);
    return ok(result);
  } catch (error) {
    return serverError("Unable to delete user", error);
  }
}
