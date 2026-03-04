import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { deleteAdminOrderScoped, updateAdminOrderScoped } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const identity = await authorizeAdminRequest(request, "orders");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      status?: "placed" | "packed" | "out-for-delivery" | "delivered" | "cancelled";
      riderId?: string;
    };

    if (!body.status && typeof body.riderId !== "string") {
      return badRequest("Provide status or riderId");
    }

    const updated = await updateAdminOrderScoped({
      orderId: id,
      updates: body,
      scope: identity,
    });

    return ok(updated);
  } catch (error) {
    if (error instanceof Error && (error.message === "FORBIDDEN_ORDER_SCOPE" || error.message === "ORDER_NOT_FOUND")) {
      return unauthorized("Not allowed");
    }

    return serverError("Unable to update order", error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const identity = await authorizeAdminRequest(request, "orders");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const { id } = await context.params;
    const result = await deleteAdminOrderScoped({ orderId: id, scope: identity });
    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_ORDER_SCOPE") {
      return unauthorized("Not allowed");
    }

    return serverError("Unable to delete order", error);
  }
}
