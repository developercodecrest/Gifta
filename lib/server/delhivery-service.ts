import { ObjectId } from "mongodb";
import { publishOrderSnapshot, publishUserNotification } from "@/lib/server/firebase-realtime";
import { getMongoDb } from "@/lib/mongodb";
import { AdminOrderDto, PaymentMethod, ShippingAddressSnapshot, ShippingPackageSnapshot, ShippingProvider } from "@/types/api";

type DelhiveryMode = "test" | "live";

type DelhiveryConfig = {
  mode: DelhiveryMode;
  baseUrl: string;
  expectedTatBaseUrl: string;
  token: string;
  pincodePath: string;
  shipmentCreatePath: string;
  pickupRequestPath: string;
  waybillPath: string;
  trackPath: string;
  expectedTatPath: string;
  expectedTatModeOfTransport: string;
  expectedTatProductType: string;
  defaultOriginPin?: string;
  defaultPickupLocationName?: string;
  webhookSecret?: string;
  defaultPackage: ShippingPackageSnapshot;
};

type ServiceabilityResult = {
  pinCode: string;
  serviceable: boolean;
  embargoed: boolean;
  remark?: string;
  raw: unknown;
};

export type DeliveryFeeEstimate = {
  estimatedFee: number;
  source: "delhivery" | "fallback";
  serviceable: boolean;
  remark?: string;
  expectedTat?: DelhiveryExpectedTatSummary;
};

export type DelhiveryExpectedTatEstimate = {
  originPin: string;
  destinationPin: string;
  expectedDays?: number;
  expectedDeliveryDate?: string;
  pickupDate: string;
  raw: unknown;
};

export type DelhiveryExpectedTatSummary = {
  source: "delhivery" | "fallback";
  estimates: DelhiveryExpectedTatEstimate[];
  minimumDays?: number;
  maximumDays?: number;
  earliestDeliveryDate?: string;
  latestDeliveryDate?: string;
  remark?: string;
};

export class DelhiveryApiError extends Error {
  status: number;
  body: unknown;
  code: string;

  constructor(message: string, options: { status: number; body: unknown; code?: string }) {
    super(message);
    this.name = "DelhiveryApiError";
    this.status = options.status;
    this.body = options.body;
    this.code = options.code ?? "DELHIVERY_API_ERROR";
  }
}

type ShipmentCreateInput = {
  orderRef: string;
  storeId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  pickup: ShippingAddressSnapshot;
  pickupLocationName: string;
  destination: ShippingAddressSnapshot;
  packageDetails: ShippingPackageSnapshot;
  productsDescription?: string;
  sellerName?: string;
  sellerAddress?: string;
};

type ShipmentCreateResult = {
  provider: ShippingProvider;
  providerStatus: string;
  awb?: string;
  shipmentId?: string;
  pickupRequestId?: string;
  raw: unknown;
};

type FulfillmentResult = {
  orderRef: string;
  attemptedStores: number;
  createdStores: number;
  skippedStores: number;
  failedStores: number;
};

export type DelhiveryDiagnosticsResult = {
  mode: DelhiveryMode;
  baseUrl: string;
  pincodePath: string;
  serviceability: ServiceabilityResult;
  waybillAvailable: boolean;
  sampleWaybill?: string;
};

export type DelhiveryTrackingEvent = {
  timestamp?: string;
  status: string;
  location?: string;
  remarks?: string;
  raw: Record<string, unknown>;
};

export type DelhiveryTrackingResult = {
  awb?: string;
  orderRef?: string;
  currentStatus?: string;
  delivered: boolean;
  events: DelhiveryTrackingEvent[];
  raw: unknown;
};

function shouldBypassServiceabilityAuthFailure() {
  const explicit = process.env.DELHIVERY_BYPASS_SERVICEABILITY_ON_AUTH_FAILURE?.trim().toLowerCase();
  if (explicit === "true") {
    return true;
  }
  if (explicit === "false") {
    return false;
  }

  return (process.env.DELHIVERY_MODE ?? "test").trim().toLowerCase() !== "live";
}

type StoreDoc = {
  _id?: ObjectId;
  id: string;
  name: string;
  details?: {
    location?: {
      addressLine1?: string;
      city?: string;
      state?: string;
      pincode?: string;
      country?: string;
    };
  };
};

export function isDelhiveryConfigured() {
  try {
    getDelhiveryConfig();
    return true;
  } catch {
    return false;
  }
}

export function getDelhiveryConfig(): DelhiveryConfig {
  const mode = (process.env.DELHIVERY_MODE ?? "test").toLowerCase() === "live" ? "live" : "test";
  const testToken = process.env.DELHIVERY_API_TOKEN_TEST?.trim();
  const liveToken = process.env.DELHIVERY_API_TOKEN_LIVE?.trim();

  const token = mode === "live" ? liveToken : testToken;
  if (!token) {
    throw new Error(`Delhivery token missing for mode: ${mode}. Set DELHIVERY_API_TOKEN_${mode.toUpperCase()}.`);
  }

  const testBaseUrl = normalizeBaseUrl(process.env.DELHIVERY_TEST_BASE_URL, "https://staging-express.delhivery.com");
  const liveBaseUrl = normalizeBaseUrl(process.env.DELHIVERY_LIVE_BASE_URL, "https://track.delhivery.com");
  const expectedTatTestBaseUrl = normalizeBaseUrl(process.env.DELHIVERY_EXPECTED_TAT_TEST_BASE_URL, "https://express-dev-test.delhivery.com");
  const expectedTatLiveBaseUrl = normalizeBaseUrl(process.env.DELHIVERY_EXPECTED_TAT_LIVE_BASE_URL, liveBaseUrl);

  const defaultPackage = {
    deadWeightKg: Number(process.env.DELHIVERY_DEFAULT_WEIGHT_KG ?? "0.5"),
    lengthCm: Number(process.env.DELHIVERY_DEFAULT_LENGTH_CM ?? "20"),
    breadthCm: Number(process.env.DELHIVERY_DEFAULT_BREADTH_CM ?? "15"),
    heightCm: Number(process.env.DELHIVERY_DEFAULT_HEIGHT_CM ?? "10"),
    quantity: 1,
  } satisfies ShippingPackageSnapshot;

  return {
    mode,
    baseUrl: mode === "live" ? liveBaseUrl : testBaseUrl,
    expectedTatBaseUrl: mode === "live" ? expectedTatLiveBaseUrl : expectedTatTestBaseUrl,
    token,
    pincodePath: (process.env.DELHIVERY_PINCODE_PATH ?? "/c/api/pin-codes/json/").trim(),
    shipmentCreatePath: (process.env.DELHIVERY_SHIPMENT_CREATE_PATH ?? "/api/cmu/create.json").trim(),
    pickupRequestPath: (process.env.DELHIVERY_PICKUP_REQUEST_PATH ?? "/fm/request/new/").trim(),
    waybillPath: (process.env.DELHIVERY_WAYBILL_PATH ?? "/waybill/api/bulk/json/").trim(),
    trackPath: (process.env.DELHIVERY_TRACK_PATH ?? "/api/v1/packages/json/").trim(),
    expectedTatPath: (process.env.DELHIVERY_EXPECTED_TAT_PATH ?? "/api/dc/expected_tat").trim(),
    expectedTatModeOfTransport: (process.env.DELHIVERY_EXPECTED_TAT_MOT ?? "S").trim().toUpperCase() || "S",
    expectedTatProductType: (process.env.DELHIVERY_EXPECTED_TAT_PDT ?? "B2C").trim().toUpperCase() || "B2C",
    defaultOriginPin: process.env.DELHIVERY_DEFAULT_ORIGIN_PIN?.trim() || undefined,
    defaultPickupLocationName: process.env.DELHIVERY_DEFAULT_PICKUP_LOCATION_NAME?.trim() || undefined,
    webhookSecret: process.env.DELHIVERY_WEBHOOK_SECRET,
    defaultPackage,
  };
}

export async function checkDelhiveryServiceability(pinCode: string): Promise<ServiceabilityResult> {
  const config = getDelhiveryConfig();
  const normalizedPin = pinCode.trim();
  const query = `filter_codes=${encodeURIComponent(normalizedPin)}`;
  const url = `${config.baseUrl}${config.pincodePath}?${query}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Token ${config.token}`,
      Accept: "application/json",
    },
  });

  const body = await parseDelhiveryResponseBody(response);
  if (!response.ok) {
    if (response.status === 401 && shouldBypassServiceabilityAuthFailure()) {
      return {
        pinCode: normalizedPin,
        serviceable: true,
        embargoed: false,
        remark: "AUTH_BYPASSED",
        raw: body,
      };
    }

    throw new DelhiveryApiError(`Delhivery serviceability check failed (${response.status}).`, {
      status: response.status,
      body,
      code: response.status === 401 ? "DELHIVERY_AUTH_FAILED" : "DELHIVERY_SERVICEABILITY_FAILED",
    });
  }

  const records = extractServiceabilityRecords(body);
  const matched = records.find((entry) => {
    const value = String(entry.pinCode ?? "").trim();
    return value === normalizedPin;
  });

  if (!records.length || !matched) {
    return {
      pinCode: normalizedPin,
      serviceable: false,
      embargoed: false,
      remark: "NSZ",
      raw: body,
    };
  }

  const remark = (matched.remark ?? "").trim();
  const embargoed = /embargo/i.test(remark);

  return {
    pinCode: normalizedPin,
    serviceable: !embargoed,
    embargoed,
    remark,
    raw: body,
  };
}

export async function estimateDelhiveryDeliveryFee(pinCode: string, subtotal: number): Promise<DeliveryFeeEstimate> {
  const normalizedPin = pinCode.trim();
  const safeSubtotal = Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0;
  const fallback = safeSubtotal >= 1500 ? 0 : 99;

  if (!isDelhiveryConfigured()) {
    return {
      estimatedFee: fallback,
      source: "fallback",
      serviceable: true,
    };
  }

  const serviceability = await checkDelhiveryServiceability(normalizedPin);
  if (!serviceability.serviceable) {
    return {
      estimatedFee: 0,
      source: "fallback",
      serviceable: false,
      remark: serviceability.remark,
    };
  }

  const config = getDelhiveryConfig();
  const estimatePath = (process.env.DELHIVERY_CHARGE_ESTIMATE_PATH ?? "").trim();
  if (!estimatePath) {
    return {
      estimatedFee: fallback,
      source: "fallback",
      serviceable: true,
      remark: serviceability.remark,
    };
  }

  const estimateUrl = `${config.baseUrl}${estimatePath}`;
  const response = await fetch(estimateUrl, {
    method: "POST",
    headers: {
      Authorization: `Token ${config.token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      destination_pincode: normalizedPin,
      cod_amount: 0,
      declared_value: Math.round(safeSubtotal),
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new DelhiveryApiError(`Delhivery estimate failed (${response.status}).`, {
      status: response.status,
      body,
      code: response.status === 401 ? "DELHIVERY_AUTH_FAILED" : "DELHIVERY_ESTIMATE_FAILED",
    });
  }

  const fee = parseDeliveryEstimateFee(body);
  if (fee === null) {
    return {
      estimatedFee: fallback,
      source: "fallback",
      serviceable: true,
      remark: "Unable to parse Delhivery estimate response.",
    };
  }

  return {
    estimatedFee: fee,
    source: "delhivery",
    serviceable: true,
    remark: serviceability.remark,
  };
}

function parseDeliveryEstimateFee(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidates = ["estimated_fee", "total_amount", "freight_charge", "charges", "charge"];

  for (const key of candidates) {
    const value = Number((payload as Record<string, unknown>)[key]);
    if (Number.isFinite(value) && value >= 0) {
      return Math.round(value);
    }
  }

  const data = (payload as Record<string, unknown>).data;
  if (data && typeof data === "object") {
    for (const key of candidates) {
      const value = Number((data as Record<string, unknown>)[key]);
      if (Number.isFinite(value) && value >= 0) {
        return Math.round(value);
      }
    }
  }

  return null;
}

export async function getDelhiveryOriginPins(storeIds: string[]): Promise<string[]> {
  const config = getDelhiveryConfig();
  const uniqueStoreIds = Array.from(new Set(storeIds.map((value) => value.trim()).filter(Boolean)));

  if (!uniqueStoreIds.length) {
    return config.defaultOriginPin ? [config.defaultOriginPin] : [];
  }

  const db = await getMongoDb();
  const stores = db.collection<StoreDoc>("stores");
  const storeDocs = await stores
    .find(
      { id: { $in: uniqueStoreIds } },
      {
        projection: {
          id: 1,
          name: 1,
          "details.location.pincode": 1,
        },
      },
    )
    .toArray();

  const originPins = Array.from(
    new Set(
      storeDocs
        .map((entry) => entry.details?.location?.pincode?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (originPins.length) {
    return originPins;
  }

  return config.defaultOriginPin ? [config.defaultOriginPin] : [];
}

export async function getDelhiveryExpectedTatSummary(input: {
  originPins: string[];
  destinationPin: string;
  expectedPickupDate?: string;
}): Promise<DelhiveryExpectedTatSummary> {
  const config = getDelhiveryConfig();
  const destinationPin = input.destinationPin.trim();
  const originPins = Array.from(new Set(input.originPins.map((value) => value.trim()).filter(Boolean)));

  if (!originPins.length || !destinationPin) {
    return {
      source: "fallback",
      estimates: [],
      remark: "Origin pin unavailable for expected delivery estimate.",
    };
  }

  const expectedPickupDate = input.expectedPickupDate?.trim() || buildExpectedTatPickupDate();
  const settled = await Promise.allSettled(
    originPins.map((originPin) =>
      getExpectedTatForLane({
        config,
        originPin,
        destinationPin,
        expectedPickupDate,
      }),
    ),
  );

  const estimates = settled
    .filter((entry): entry is PromiseFulfilledResult<DelhiveryExpectedTatEstimate> => entry.status === "fulfilled")
    .map((entry) => entry.value);

  if (!estimates.length) {
    const firstFailure = settled.find((entry): entry is PromiseRejectedResult => entry.status === "rejected");
    if (firstFailure?.reason instanceof Error) {
      throw firstFailure.reason;
    }
    throw new Error("Unable to fetch Delhivery expected delivery timeline.");
  }

  const dayValues = estimates
    .map((entry) => entry.expectedDays)
    .filter((value): value is number => Number.isFinite(value));
  const deliveryDates = estimates
    .map((entry) => entry.expectedDeliveryDate)
    .filter((value): value is string => Boolean(value))
    .sort();

  return {
    source: "delhivery",
    estimates,
    ...(dayValues.length
      ? {
          minimumDays: Math.min(...dayValues),
          maximumDays: Math.max(...dayValues),
        }
      : {}),
    ...(deliveryDates.length
      ? {
          earliestDeliveryDate: deliveryDates[0],
          latestDeliveryDate: deliveryDates[deliveryDates.length - 1],
        }
      : {}),
    ...(settled.some((entry) => entry.status === "rejected")
      ? { remark: "Some vendor delivery lanes could not be estimated right now." }
      : {}),
  };
}

async function getExpectedTatForLane(input: {
  config: DelhiveryConfig;
  originPin: string;
  destinationPin: string;
  expectedPickupDate: string;
}): Promise<DelhiveryExpectedTatEstimate> {
  const params = new URLSearchParams({
    origin_pin: input.originPin,
    destination_pin: input.destinationPin,
    mot: input.config.expectedTatModeOfTransport,
  });

  if (input.config.expectedTatProductType) {
    params.set("pdt", input.config.expectedTatProductType);
  }

  if (input.expectedPickupDate) {
    params.set("expected_pickup_date", input.expectedPickupDate);
  }

  const response = await fetch(`${input.config.expectedTatBaseUrl}${input.config.expectedTatPath}?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Token ${input.config.token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  const body = await parseDelhiveryResponseBody(response);
  if (!response.ok) {
    throw new DelhiveryApiError(`Delhivery expected TAT failed (${response.status}).`, {
      status: response.status,
      body,
      code: response.status === 401 || response.status === 403 ? "DELHIVERY_AUTH_FAILED" : "DELHIVERY_EXPECTED_TAT_FAILED",
    });
  }

  const parsed = parseExpectedTatResponse(body);
  return {
    originPin: input.originPin,
    destinationPin: input.destinationPin,
    expectedDays: parsed.expectedDays,
    expectedDeliveryDate: parsed.expectedDeliveryDate,
    pickupDate: input.expectedPickupDate,
    raw: body,
  };
}

export async function createShipmentForOrderRef(orderRef: string): Promise<FulfillmentResult> {
  const db = await getMongoDb();
  const orders = db.collection<AdminOrderDto>("orders");
  const stores = db.collection<StoreDoc>("stores");

  const orderDocs = await orders.find({ orderRef }).toArray();
  if (!orderDocs.length) {
    return { orderRef, attemptedStores: 0, createdStores: 0, skippedStores: 0, failedStores: 0 };
  }

  const groupedByStore = new Map<string, AdminOrderDto[]>();
  for (const row of orderDocs) {
    const key = row.storeId || "direct";
    const existing = groupedByStore.get(key) ?? [];
    existing.push(row);
    groupedByStore.set(key, existing);
  }

  let createdStores = 0;
  let skippedStores = 0;
  let failedStores = 0;

  for (const [storeId, rows] of groupedByStore.entries()) {
    const first = rows[0];
    const isRazorpay = (first.paymentMethod ?? "cod") === "razorpay";
    const hasSuccessfulPayment = rows.some((entry) => entry.transactionStatus === "success");

    if (isRazorpay && !hasSuccessfulPayment) {
      skippedStores += 1;
      continue;
    }

    const hasShipment = rows.some((entry) => Boolean(entry.shippingAwb || entry.shippingShipmentId));
    if (hasShipment) {
      skippedStores += 1;
      continue;
    }

    const destination = first.deliveryAddress;

    if (!destination?.line1 || !destination.city || !destination.state || !destination.pinCode) {
      await applyShipmentFailure(rows, "Missing destination address for Delhivery fulfillment.");
      failedStores += 1;
      continue;
    }

    const store = storeId === "direct" ? null : await stores.findOne({ id: storeId });
    const pickup = resolvePickupAddress(store);
    const pickupLocationName = resolvePickupLocationName(store, storeId);

    if (!pickup) {
      await applyShipmentFailure(rows, "Missing vendor pickup address for Delhivery fulfillment.");
      failedStores += 1;
      continue;
    }

    const amount = rows.reduce((sum, row) => sum + (row.totalAmount || 0), 0);
    const totalQuantity = rows.reduce((sum, row) => sum + (row.quantity || 0), 0);

    const packageDetails = {
      ...getDelhiveryConfig().defaultPackage,
      quantity: Math.max(1, totalQuantity),
    } satisfies ShippingPackageSnapshot;

    try {
      const shipment = await createDelhiveryShipment({
        orderRef,
        storeId,
        amount,
        paymentMethod: first.paymentMethod ?? "cod",
        pickup,
        pickupLocationName,
        destination,
        packageDetails,
        productsDescription: rows.map((row) => row.productId).filter(Boolean).join(", "),
        sellerName: store?.name ?? pickup.receiverName,
        sellerAddress: pickup.line1,
      });

      await orders.updateMany(
        { id: { $in: rows.map((row) => row.id) } },
        {
          $set: {
            shippingProvider: "delhivery",
            shippingProviderStatus: shipment.providerStatus,
            ...(shipment.awb ? { shippingAwb: shipment.awb } : {}),
            ...(shipment.shipmentId ? { shippingShipmentId: shipment.shipmentId } : {}),
            ...(shipment.pickupRequestId ? { shippingPickupRequestId: shipment.pickupRequestId } : {}),
            pickupAddress: pickup,
            shippingPackage: packageDetails,
            shippingLastSyncedAt: new Date().toISOString(),
          },
          $unset: {
            shippingError: "",
          },
          $push: {
            shippingEvents: {
              timestamp: new Date().toISOString(),
              status: shipment.providerStatus,
              description: "Shipment created with Delhivery",
            },
          },
        },
      );

      createdStores += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create shipment with Delhivery.";
      await applyShipmentFailure(rows, message);
      failedStores += 1;
    }
  }

  return {
    orderRef,
    attemptedStores: groupedByStore.size,
    createdStores,
    skippedStores,
    failedStores,
  };
}

export async function runDelhiveryDiagnostics(pinCode: string): Promise<DelhiveryDiagnosticsResult> {
  const config = getDelhiveryConfig();
  const serviceability = await checkDelhiveryServiceability(pinCode);
  const sampleWaybill = await fetchWaybill().catch(() => undefined);

  return {
    mode: config.mode,
    baseUrl: config.baseUrl,
    pincodePath: config.pincodePath,
    serviceability,
    waybillAvailable: Boolean(sampleWaybill),
    sampleWaybill,
  };
}

export async function trackDelhiveryShipment(input: { awb?: string; orderRef?: string }): Promise<DelhiveryTrackingResult> {
  const config = getDelhiveryConfig();
  const awb = input.awb?.trim();
  const orderRef = input.orderRef?.trim();

  if (!awb && !orderRef) {
    throw new Error("awb or orderRef is required to track Delhivery shipment.");
  }

  const params = new URLSearchParams();
  if (awb) {
    params.set("waybill", awb);
  }
  if (orderRef) {
    params.set("ref_ids", orderRef);
  }

  const response = await fetch(`${config.baseUrl}${config.trackPath}?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Token ${config.token}`,
      Accept: "application/json",
    },
  });

  const body = await parseDelhiveryResponseBody(response);
  if (!response.ok) {
    throw new Error(`Delhivery tracking API failed (${response.status}).`);
  }

  const events = extractTrackingEvents(body);
  const currentStatus = extractTrackingStatus(body, events);
  const delivered = /delivered/i.test(currentStatus ?? "") || events.some((entry) => /delivered/i.test(entry.status));

  return {
    awb: awb ?? extractFirstString(body, ["ShipmentData", 0, "Shipment", "Waybill"]),
    orderRef,
    currentStatus,
    delivered,
    events,
    raw: body,
  };
}

export async function applyDelhiveryWebhookUpdate(payload: Record<string, unknown>) {
  const db = await getMongoDb();
  const orders = db.collection<AdminOrderDto>("orders");

  const status = extractString(payload.status) ?? extractString(payload.current_status) ?? "update";
  const awb = extractString(payload.waybill) ?? extractString(payload.awb);
  const orderRef = extractString(payload.order) ?? extractString(payload.order_id) ?? extractString(payload.orderRef);
  const description = extractString(payload.instructions) ?? extractString(payload.remarks) ?? extractString(payload.message);

  const query: Record<string, unknown> = awb
    ? { shippingAwb: awb }
    : orderRef
      ? { orderRef }
      : {};

  if (!Object.keys(query).length) {
    return { matchedCount: 0, modifiedCount: 0, status };
  }

  const mappedOrderStatus = mapProviderStatusToOrderStatus(status);
  const baseSet: Record<string, unknown> = {
    shippingProvider: "delhivery",
    shippingProviderStatus: status,
    ...(awb ? { shippingAwb: awb } : {}),
    shippingLastSyncedAt: new Date().toISOString(),
  };

  if (mappedOrderStatus === "delivered") {
    baseSet.status = "delivered";
  }

  const update = await orders.updateMany(
    query,
    {
      $set: baseSet,
      $push: {
        shippingEvents: {
          timestamp: new Date().toISOString(),
          status,
          description,
          raw: payload,
        },
      },
    },
  );

  if (mappedOrderStatus && mappedOrderStatus !== "delivered") {
    await orders.updateMany(
      {
        ...query,
        status: { $ne: "delivered" },
      },
      {
        $set: {
          status: mappedOrderStatus,
        },
      },
    );
  }

  const updatedOrders = await orders
    .find(query)
    .project({
      orderRef: 1,
      customerUserId: 1,
      status: 1,
      shippingProviderStatus: 1,
      transactionStatus: 1,
    })
    .toArray();

  const realtimeTargets = new Map<string, {
    userId: string;
    orderRef: string;
    orderStatus: AdminOrderDto["status"];
    shippingStatus?: string;
    paymentStatus?: string;
  }>();

  for (const entry of updatedOrders) {
    if (!entry.customerUserId || !entry.orderRef) {
      continue;
    }

    const key = `${entry.customerUserId}:${entry.orderRef}`;
    realtimeTargets.set(key, {
      userId: entry.customerUserId,
      orderRef: entry.orderRef,
      orderStatus: entry.status,
      shippingStatus: entry.shippingProviderStatus,
      paymentStatus: entry.transactionStatus,
    });
  }

  if (realtimeTargets.size) {
    await Promise.all(
      Array.from(realtimeTargets.values()).map(async (entry) => {
        await publishOrderSnapshot(entry.userId, entry.orderRef, {
          status: entry.orderStatus,
          shippingStatus: entry.shippingStatus,
          paymentStatus: entry.paymentStatus,
          timeline: [
            {
              status,
              timestamp: new Date().toISOString(),
              note: description,
            },
          ],
        }).catch(() => undefined);

        await publishUserNotification(entry.userId, {
          id: `ord-${entry.orderRef}-${status.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          type: "order-update",
          title: "Shipping update",
          message: description || `Order ${entry.orderRef} status changed to ${status}.`,
          orderRef: entry.orderRef,
        }).catch(() => undefined);
      }),
    );
  }

  return {
    matchedCount: update.matchedCount,
    modifiedCount: update.modifiedCount,
    status,
  };
}

async function createDelhiveryShipment(input: ShipmentCreateInput): Promise<ShipmentCreateResult> {
  const config = getDelhiveryConfig();
  const waybill = await fetchWaybill().catch(() => undefined);

  const paymentMode = input.paymentMethod === "cod" ? "COD" : "Prepaid";
  const shippingMode = (process.env.DELHIVERY_SHIPPING_MODE ?? "Surface").trim() || "Surface";
  const addressType = (process.env.DELHIVERY_ADDRESS_TYPE ?? "home").trim();
  const shipmentWeightGrams = Math.max(1, Math.round(input.packageDetails.deadWeightKg * 1000));
  const shipment = {
    order: input.orderRef,
    waybill,
    name: input.destination.receiverName ?? "Gifta Customer",
    add: input.destination.line1,
    pin: input.destination.pinCode,
    city: input.destination.city,
    state: input.destination.state,
    country: input.destination.country || "India",
    phone: input.destination.receiverPhone ?? "",
    payment_mode: paymentMode,
    return_name: input.pickup.receiverName ?? input.sellerName ?? "Gifta Warehouse",
    return_add: input.pickup.line1,
    return_city: input.pickup.city,
    return_state: input.pickup.state,
    return_country: input.pickup.country || "India",
    return_pin: input.pickup.pinCode,
    return_phone: input.pickup.receiverPhone ?? "",
    products_desc: input.productsDescription ?? "",
    total_amount: Number(input.amount.toFixed(2)),
    cod_amount: input.paymentMethod === "cod" ? Number(input.amount.toFixed(2)) : 0,
    seller_add: input.sellerAddress ?? input.pickup.line1,
    seller_name: input.sellerName ?? input.pickup.receiverName ?? "Gifta",
    quantity: String(input.packageDetails.quantity),
    order_date: new Date().toISOString().slice(0, 10),
    shipment_width: input.packageDetails.breadthCm,
    shipment_height: input.packageDetails.heightCm,
    shipment_length: input.packageDetails.lengthCm,
    weight: shipmentWeightGrams,
    shipping_mode: shippingMode,
    address_type: addressType,
    pickup_location: input.pickupLocationName,
  };

  const payload = {
    shipments: [shipment],
    pickup_location: {
      name: input.pickupLocationName,
      add: input.pickup.line1,
      city: input.pickup.city,
      state: input.pickup.state,
      pin: input.pickup.pinCode,
      country: input.pickup.country,
      phone: input.pickup.receiverPhone ?? "",
    },
  };

  const response = await fetch(`${config.baseUrl}${config.shipmentCreatePath}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${config.token}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      format: "json",
      data: JSON.stringify(payload),
    }),
  });

  const data = await parseDelhiveryResponseBody(response);
  if (!response.ok) {
    throw new Error(`Delhivery shipment API failed (${response.status}).`);
  }

  const awb = extractFirstString(data, ["packages", 0, "waybill"])
    ?? extractFirstString(data, ["packages", 0, "awb"])
    ?? extractFirstString(data, ["waybill"])
    ?? waybill;

  const shipmentId = extractFirstString(data, ["packages", 0, "shipment_id"])
    ?? extractFirstString(data, ["shipment_id"])
    ?? extractFirstString(data, ["reference"]);

  const pickupRequestId = await createPickupRequest({
    pickupLocation: input.pickupLocationName,
    expectedPackageCount: input.packageDetails.quantity,
  }).catch(() => undefined);

  return {
    provider: "delhivery",
    providerStatus: "shipment-created",
    awb,
    shipmentId,
    pickupRequestId,
    raw: data,
  };
}

async function fetchWaybill() {
  const config = getDelhiveryConfig();
  const url = `${config.baseUrl}${config.waybillPath}?count=1`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Token ${config.token}`,
      Accept: "application/json",
    },
  });

  const data = await parseDelhiveryResponseBody(response);
  if (!response.ok) {
    throw new Error(`Unable to fetch Delhivery waybill (${response.status}).`);
  }

  const waybills = extractStringArray(data);
  return waybills[0];
}

async function createPickupRequest(input: { pickupLocation: string; expectedPackageCount: number }) {
  const config = getDelhiveryConfig();
  const now = new Date();
  const pickupDate = now.toISOString().slice(0, 10);
  const pickupTime = `${String(now.getHours()).padStart(2, "0")}:00`;

  const response = await fetch(`${config.baseUrl}${config.pickupRequestPath}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${config.token}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      pickup_location: input.pickupLocation,
      expected_package_count: String(Math.max(1, input.expectedPackageCount)),
      pickup_date: pickupDate,
      pickup_time: pickupTime,
    }),
  });

  const data = await parseDelhiveryResponseBody(response);
  if (!response.ok) {
    throw new Error(`Unable to create Delhivery pickup request (${response.status}).`);
  }

  return extractFirstString(data, ["pickup_id"])
    ?? extractFirstString(data, ["request_id"])
    ?? extractFirstString(data, ["id"]);
}

async function applyShipmentFailure(rows: AdminOrderDto[], message: string) {
  const db = await getMongoDb();
  const orders = db.collection<AdminOrderDto>("orders");

  await orders.updateMany(
    { id: { $in: rows.map((row) => row.id) } },
    {
      $set: {
        shippingProvider: "delhivery",
        shippingProviderStatus: "shipment-failed",
        shippingError: message,
        shippingLastSyncedAt: new Date().toISOString(),
      },
      $push: {
        shippingEvents: {
          timestamp: new Date().toISOString(),
          status: "shipment-failed",
          description: message,
        },
      },
    },
  );
}

function resolvePickupAddress(store: StoreDoc | null): ShippingAddressSnapshot | null {
  const location = store?.details?.location;
  if (!location?.addressLine1 || !location.city || !location.state || !location.pincode) {
    return null;
  }

  return {
    line1: location.addressLine1,
    city: location.city,
    state: location.state,
    pinCode: location.pincode,
    country: location.country || "India",
    receiverName: store?.name,
    receiverPhone: "",
  };
}

function resolvePickupLocationName(store: StoreDoc | null, storeId: string) {
  const configuredDefault = getDelhiveryConfig().defaultPickupLocationName;
  if (store?.name?.trim()) {
    return store.name.trim();
  }

  if (configuredDefault) {
    return configuredDefault;
  }

  return storeId === "direct" ? "Gifta Warehouse" : storeId;
}

function mapProviderStatusToOrderStatus(status: string): AdminOrderDto["status"] | null {
  const normalized = status.toLowerCase();
  if (normalized.includes("delivered")) return "delivered";
  if (normalized.includes("out for delivery") || normalized.includes("out_for_delivery")) return "out-for-delivery";
  if (normalized.includes("in transit") || normalized.includes("in_transit")) return "packed";
  if (normalized.includes("picked") || normalized.includes("manifest")) return "packed";
  if (normalized.includes("dispatched") || normalized.includes("packed")) return "packed";
  if (normalized.includes("cancel") || normalized.includes("rto")) return "cancelled";
  return null;
}

function extractServiceabilityRecords(body: unknown) {
  if (!body || typeof body !== "object") {
    return [];
  }

  const payload = body as Record<string, unknown>;

  const fromDeliveryCodes = (payload.delivery_codes as Array<Record<string, unknown>> | undefined)?.map((entry) => {
    const postalCode = entry.postal_code as Record<string, unknown> | undefined;
    return {
      pinCode: extractString(postalCode?.pin ?? postalCode?.pincode ?? postalCode?.postal_code),
      remark: extractString(postalCode?.remark ?? postalCode?.remarks),
    };
  }) ?? [];

  if (fromDeliveryCodes.length) {
    return fromDeliveryCodes;
  }

  const genericArray = Object.values(payload).find((value) => Array.isArray(value)) as Array<Record<string, unknown>> | undefined;
  if (!genericArray) {
    return [];
  }

  return genericArray.map((entry) => ({
    pinCode: extractString(entry.pin ?? entry.pincode ?? entry.postal_code),
    remark: extractString(entry.remark ?? entry.remarks),
  }));
}

function normalizeBaseUrl(value: string | undefined, fallback: string) {
  return (value?.trim() || fallback).replace(/\/$/, "");
}

function buildExpectedTatPickupDate() {
  const configuredTime = (process.env.DELHIVERY_EXPECTED_TAT_PICKUP_TIME ?? "12:00").trim() || "12:00";
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day} ${configuredTime}`;
}

async function parseDelhiveryResponseBody(response: Response) {
  const rawText = await response.text();
  if (!rawText) {
    return {};
  }

  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    return rawText;
  }
}

function parseExpectedTatResponse(payload: unknown) {
  const objects = collectTatObjects(payload);

  for (const entry of objects) {
    const expectedDays = pickNumber(entry, ["expected_tat", "tat", "days", "tat_days", "lead_time", "total_tat"]);
    const expectedDeliveryDate = pickString(entry, ["expected_delivery_date", "delivery_date", "edd", "expected_date", "delivery_datetime"]);

    if (expectedDays !== undefined || expectedDeliveryDate) {
      return {
        expectedDays,
        expectedDeliveryDate,
      };
    }
  }

  return {
    expectedDays: undefined,
    expectedDeliveryDate: undefined,
  };
}

function collectTatObjects(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return [] as Array<Record<string, unknown>>;
  }

  const root = payload as Record<string, unknown>;
  const candidates: Array<Record<string, unknown>> = [root];

  for (const key of ["data", "result", "results", "response"]) {
    const value = root[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      candidates.push(value as Record<string, unknown>);
    }
    if (Array.isArray(value)) {
      candidates.push(...value.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object"));
    }
  }

  for (const value of Object.values(root)) {
    if (Array.isArray(value)) {
      candidates.push(...value.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object"));
    }
  }

  return candidates;
}

function pickNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = Number(record[key]);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function pickString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = extractString(record[key]);
    if (value) {
      return value;
    }
  }
  return undefined;
}

function extractString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  return undefined;
}

function extractFirstString(root: unknown, path: Array<string | number>) {
  let current: unknown = root;
  for (const key of path) {
    if (typeof key === "number") {
      if (!Array.isArray(current)) {
        return undefined;
      }
      current = current[key];
    } else {
      if (!current || typeof current !== "object") {
        return undefined;
      }
      current = (current as Record<string, unknown>)[key];
    }
  }

  return extractString(current);
}

function extractStringArray(root: unknown): string[] {
  if (Array.isArray(root)) {
    return root.map((entry) => extractString(entry)).filter((entry): entry is string => Boolean(entry));
  }

  if (!root || typeof root !== "object") {
    return [];
  }

  const objectValues = Object.values(root as Record<string, unknown>);
  for (const value of objectValues) {
    if (Array.isArray(value)) {
      const candidate = value.map((entry) => extractString(entry)).filter((entry): entry is string => Boolean(entry));
      if (candidate.length) {
        return candidate;
      }
    }
  }

  return [];
}

function extractTrackingStatus(root: unknown, events: DelhiveryTrackingEvent[]) {
  return extractFirstString(root, ["ShipmentData", 0, "Shipment", "Status", "Status"])
    ?? extractFirstString(root, ["status"])
    ?? events[0]?.status;
}

function extractTrackingEvents(root: unknown): DelhiveryTrackingEvent[] {
  const scans = (extractFirstArray(root, ["ShipmentData", 0, "Shipment", "Scans"]) ?? []) as Array<Record<string, unknown>>;

  const mapped = scans.map((entry) => {
    const scanDetail = (entry.ScanDetail as Record<string, unknown> | undefined) ?? {};
    const status = extractString(scanDetail.Scan ?? scanDetail.Status ?? scanDetail.status) ?? "update";
    const location = extractString(scanDetail.ScannedLocation ?? scanDetail.location ?? scanDetail.city);
    const remarks = extractString(scanDetail.Instructions ?? scanDetail.Remarks ?? scanDetail.description);
    const timestamp = extractString(scanDetail.ScanDateTime ?? scanDetail.ScanDate ?? scanDetail.timestamp);

    return {
      timestamp,
      status,
      location,
      remarks,
      raw: {
        ...entry,
      },
    } satisfies DelhiveryTrackingEvent;
  });

  return mapped.reverse();
}

function extractFirstArray(root: unknown, path: Array<string | number>): unknown[] | undefined {
  let current: unknown = root;
  for (const key of path) {
    if (typeof key === "number") {
      if (!Array.isArray(current)) {
        return undefined;
      }
      current = current[key];
    } else {
      if (!current || typeof current !== "object") {
        return undefined;
      }
      current = (current as Record<string, unknown>)[key];
    }
  }

  return Array.isArray(current) ? current : undefined;
}
