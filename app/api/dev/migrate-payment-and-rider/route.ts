import { ok, serverError } from "@/lib/api-response";
import { getMongoDb } from "@/lib/mongodb";
import { AdminOrderDto } from "@/types/api";

type AppUserDoc = {
  role?: string;
};

export const runtime = "nodejs";

export async function POST() {
  try {
    const db = await getMongoDb();
    const orders = db.collection<AdminOrderDto>("orders");
    const users = db.collection<AppUserDoc>("users");

    const razorpayBackfill = await orders.updateMany(
      {
        $or: [
          { paymentId: { $exists: true, $ne: "" } },
          { razorpayOrderId: { $exists: true, $ne: "" } },
        ],
      },
      [
        {
          $set: {
            paymentMethod: "razorpay",
            transactionId: {
              $cond: [
                { $and: [{ $ne: ["$transactionId", null] }, { $ne: ["$transactionId", ""] }] },
                "$transactionId",
                "$paymentId",
              ],
            },
            transactionStatus: {
              $cond: [
                { $and: [{ $ne: ["$transactionStatus", null] }, { $ne: ["$transactionStatus", ""] }] },
                "$transactionStatus",
                "pending",
              ],
            },
          },
        },
      ],
    );

    const codBackfill = await orders.updateMany(
      {
        paymentMethod: { $exists: false },
        $or: [{ paymentId: { $exists: false } }, { paymentId: "" }],
        $and: [{ $or: [{ razorpayOrderId: { $exists: false } }, { razorpayOrderId: "" }] }],
      },
      {
        $set: {
          paymentMethod: "cod",
          transactionStatus: "cod-pending",
        },
      },
    );

    const riderIdUnset = await orders.updateMany(
      { riderId: { $exists: true } },
      { $unset: { riderId: "" } },
    );

    const riderRoleToUser = await users.updateMany(
      { role: "rider" },
      { $set: { role: "USER" } },
    );

    return ok({
      razorpayBackfill: {
        matched: razorpayBackfill.matchedCount,
        modified: razorpayBackfill.modifiedCount,
      },
      codBackfill: {
        matched: codBackfill.matchedCount,
        modified: codBackfill.modifiedCount,
      },
      riderIdUnset: {
        matched: riderIdUnset.matchedCount,
        modified: riderIdUnset.modifiedCount,
      },
      riderRoleToUser: {
        matched: riderRoleToUser.matchedCount,
        modified: riderRoleToUser.modifiedCount,
      },
    });
  } catch (error) {
    return serverError("Unable to run payment/rider migration", error);
  }
}
