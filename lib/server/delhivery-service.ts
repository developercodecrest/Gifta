import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";
import { AdminOrderDto, PaymentMethod, ShippingAddressSnapshot, ShippingPackageSnapshot, ShippingProvider } from "@/types/api";

type DelhiveryMode = "test" | "live";

type DelhiveryConfig = {
  mode: DelhiveryMode;
  baseUrl: string;
  token: string;
  pincodePath: string;
  shipmentCreatePath: string;
  pickupRequestPath: string;
  waybillPath: string;
  trackPath: string;
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

type ShipmentCreateInput = {
  orderRef: string;
  storeId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  pickup: ShippingAddressSnapshot;
  destination: ShippingAddressSnapshot;
  packageDetails: ShippingPackageSnapshot;
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

const DEFAULT_TEST_BASE_URL = "https://staging-express.delhivery.com";
const DEFAULT_LIVE_BASE_URL = "https://track.delhivery.com";

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
  const testToken = process.env.DELHIVERY_API_TOKEN_TEST;
  const liveToken = process.env.DELHIVERY_API_TOKEN_LIVE;

  const token = mode === "live" ? liveToken : testToken;
  if (!token) {
    throw new Error(`Delhivery token missing for mode: ${mode}. Set DELHIVERY_API_TOKEN_${mode.toUpperCase()}.`);
  }

  const baseUrl = (mode === "live" ? process.env.DELHIVERY_LIVE_BASE_URL : process.env.DELHIVERY_TEST_BASE_URL)
    ?? (mode === "live" ? DEFAULT_LIVE_BASE_URL : DEFAULT_TEST_BASE_URL);

  const defaultPackage = {
    deadWeightKg: Number(process.env.DELHIVERY_DEFAULT_WEIGHT_KG ?? "0.5"),
    lengthCm: Number(process.env.DELHIVERY_DEFAULT_LENGTH_CM ?? "20"),
    breadthCm: Number(process.env.DELHIVERY_DEFAULT_BREADTH_CM ?? "15"),
    heightCm: Number(process.env.DELHIVERY_DEFAULT_HEIGHT_CM ?? "10"),
    quantity: 1,
  } satisfies ShippingPackageSnapshot;

  return {
    mode,
    baseUrl: baseUrl.replace(/\/$/, ""),
    token,
    pincodePath: process.env.DELHIVERY_PINCODE_PATH ?? "/c/api/pin-codes/json/",
    shipmentCreatePath: process.env.DELHIVERY_SHIPMENT_CREATE_PATH ?? "/api/cmu/create.json",
    pickupRequestPath: process.env.DELHIVERY_PICKUP_REQUEST_PATH ?? "/fm/request/new/",
    waybillPath: process.env.DELHIVERY_WAYBILL_PATH ?? "/waybill/api/bulk/json/",
    trackPath: process.env.DELHIVERY_TRACK_PATH ?? "/api/v1/packages/json/",
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

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Delhivery serviceability check failed (${response.status}).`);
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
        destination,
        packageDetails,
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

  const body = await response.json().catch(() => ({}));
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
    total_amount: Number(input.amount.toFixed(2)),
    cod_amount: input.paymentMethod === "cod" ? Number(input.amount.toFixed(2)) : 0,
    quantity: input.packageDetails.quantity,
    shipment_width: input.packageDetails.breadthCm,
    shipment_height: input.packageDetails.heightCm,
    shipment_length: input.packageDetails.lengthCm,
    weight: input.packageDetails.deadWeightKg,
    pickup_location: `${input.storeId}-pickup`,
  };

  const payload = {
    shipments: [shipment],
    pickup_location: {
      name: `${input.storeId}-pickup`,
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

  const data = await response.json().catch(() => ({}));
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
    pickupLocation: `${input.storeId}-pickup`,
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

  const data = await response.json().catch(() => ({}));
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

  const data = await response.json().catch(() => ({}));
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
