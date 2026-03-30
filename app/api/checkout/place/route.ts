import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CART_COOKIE_NAME, parseCartCookie } from "@/lib/cart-cookie";
import { getMongoDb } from "@/lib/mongodb";
import { buildCartSnapshot } from "@/lib/server/cart-service";
import { checkDelhiveryServiceability, createShipmentForOrderRef, estimateDelhiveryDeliveryFee, getDelhiveryConfig, isDelhiveryConfigured } from "@/lib/server/delhivery-service";
import { incrementCouponUsage, validateCouponCode } from "@/lib/server/coupon-service";
import { publishOrderSnapshot, publishUserNotification } from "@/lib/server/firebase-realtime";
import { resolveRequestIdentity } from "@/lib/server/request-auth";
import { getUserCart, setUserCart } from "@/lib/server/user-cart-service";
import { AdminOrderDto, PaymentMethod, TransactionStatus } from "@/types/api";

type CheckoutPlaceRequest = {
  paymentMethod?: PaymentMethod;
  promoCode?: string;
  customer?: {
    fullName?: string;
    email?: string;
    phone?: string;
    line1?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    addressLabel?: string;
  };
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as CheckoutPlaceRequest;
  const paymentMethod = payload.paymentMethod ?? "cod";

  if (isDelhiveryConfigured()) {
    if (!payload.customer?.line1 || !payload.customer.city || !payload.customer.state || !payload.customer.pinCode) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DELIVERY_ADDRESS_REQUIRED",
            message: "Full delivery address is required for shipment creation.",
          },
        },
        { status: 400 },
      );
    }

    const serviceability = await checkDelhiveryServiceability(payload.customer.pinCode);
    if (!serviceability.serviceable) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNSERVICEABLE_PINCODE",
            message: "Delivery is currently unavailable for this pincode.",
            details: {
              pinCode: payload.customer.pinCode,
              remark: serviceability.remark,
            },
          },
        },
        { status: 400 },
      );
    }
  }

  if (paymentMethod !== "cod") {
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNSUPPORTED_PAYMENT_METHOD", message: "Only COD can be placed from this endpoint." },
      },
      { status: 400 },
    );
  }

  const identity = await resolveRequestIdentity(request);
  const userId = identity?.userId;

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Sign in is required to continue checkout.",
        },
      },
      { status: 401 },
    );
  }

  let cartItems = [];
  cartItems = await getUserCart(userId).catch(() => []);
  if (!cartItems.length) {
    const cookieStore = await cookies();
    const cartCookie = cookieStore.get(CART_COOKIE_NAME)?.value;
    cartItems = parseCartCookie(cartCookie);
  }

  const snapshot = await buildCartSnapshot(cartItems);
  if (!snapshot.lines.length) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "CART_EMPTY", message: "Your cart is empty." },
      },
      { status: 400 },
    );
  }

  const couponValidation = await validateCouponCode(payload.promoCode, snapshot.subtotal);
  const discount = couponValidation.valid ? couponValidation.discount : 0;
  const deliveryEstimate = payload.customer?.pinCode
    ? await estimateDelhiveryDeliveryFee(payload.customer.pinCode, snapshot.subtotal)
    : { estimatedFee: snapshot.shipping, source: "fallback" as const, serviceable: true };
  const shipping = deliveryEstimate.estimatedFee;
  const totalBeforeDiscount = snapshot.subtotal + snapshot.tax + snapshot.platformFee + shipping;
  const finalTotal = Math.max(0, totalBeforeDiscount - discount);

  const orderRef = createOrderRef();
  const now = new Date().toISOString();
  const transactionStatus: TransactionStatus = "cod-pending";
  const basePackage = isDelhiveryConfigured()
    ? getDelhiveryConfig().defaultPackage
    : {
        deadWeightKg: 0.5,
        lengthCm: 20,
        breadthCm: 15,
        heightCm: 10,
        quantity: 1,
      };

  const orderRows: AdminOrderDto[] = snapshot.lines.map((line, index) => ({
    id: `${orderRef}-${String(index + 1).padStart(2, "0")}`,
    orderRef,
    customerUserId: userId,
    storeId: line.selectedOffer?.storeId ?? "direct",
    productId: line.product.id,
    quantity: line.quantity,
    totalAmount: line.lineSubtotal,
    customerName: payload.customer?.fullName ?? "Gifta Customer",
    customerEmail: payload.customer?.email,
    customerPhone: payload.customer?.phone,
    deliveryAddressLabel: payload.customer?.addressLabel,
    deliveryAddress: payload.customer?.line1 && payload.customer?.city && payload.customer?.state && payload.customer?.pinCode
      ? {
          line1: payload.customer.line1,
          city: payload.customer.city,
          state: payload.customer.state,
          pinCode: payload.customer.pinCode,
          country: "India",
          receiverName: payload.customer.fullName,
          receiverPhone: payload.customer.phone,
        }
      : undefined,
    status: "placed",
    paymentMethod,
    transactionStatus,
    promoCode: couponValidation.valid ? couponValidation.code : undefined,
    discountAmount: discount,
    deliveryFee: shipping,
    shippingProvider: "delhivery",
    shippingProviderStatus: "pending-shipment",
    customization: line.customization,
    customizationSignature: line.customizationSignature,
    shippingPackage: {
      ...basePackage,
      quantity: Math.max(1, line.quantity),
    },
    createdAt: now,
  }));

  const db = await getMongoDb();
  const orders = db.collection<AdminOrderDto>("orders");
  await orders.insertMany(orderRows);

  if (userId) {
    await setUserCart(userId, []);
  }

  if (isDelhiveryConfigured()) {
    await createShipmentForOrderRef(orderRef).catch(() => undefined);
  }

  if (couponValidation.valid) {
    await incrementCouponUsage(couponValidation.code).catch(() => undefined);
  }

  if (userId) {
    await publishOrderSnapshot(userId, orderRef, {
      status: "placed",
      paymentStatus: transactionStatus,
      shippingStatus: "pending-shipment",
      timeline: [
        {
          status: "placed",
          timestamp: now,
          note: "Order placed successfully.",
        },
      ],
    }).catch(() => undefined);

    await publishUserNotification(userId, {
      id: `ord-${orderRef}-placed`,
      type: "order-update",
      title: "Order placed",
      message: `Your order ${orderRef} has been placed successfully.`,
      orderRef,
    }).catch(() => undefined);
  }

  return NextResponse.json({
    success: true,
    data: {
      orderId: orderRef,
      paymentMethod,
      transactionStatus,
      amount: finalTotal,
    },
  });
}

function createOrderRef() {
  return `GFT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}
