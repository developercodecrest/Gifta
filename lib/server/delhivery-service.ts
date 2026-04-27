import { ObjectId } from "mongodb";
import { syncOrderLifecycleEvent } from "@/lib/server/order-notification-service";
import { getMongoDb } from "@/lib/mongodb";
import { resolveShippingPackageSnapshot } from "@/lib/product-shipping";
import { CartSnapshot } from "@/lib/server/cart-service";
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
  waybillFetchPath: string;
  labelPath: string;
  trackPath: string;
  expectedTatPath: string;
  expectedTatModeOfTransport: string;
  expectedTatProductType: string;
  invoiceChargesPath: string;
  invoiceChargesModeOfTransport: string;
  invoiceChargesShipmentStatus: string;
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

export type DelhiveryShipmentOperationResult = {
  operation: "update" | "cancel";
  waybill: string;
  accepted: boolean;
  providerStatus?: string;
  raw: unknown;
};

export type DelhiveryShippingLabelResult = {
  waybill: string;
  pdf: boolean;
  pdfSize: "A4" | "4R";
  labelUrl?: string;
  labelData?: unknown;
  raw: unknown;
};

export type DelhiveryPickupScheduleResult = {
  pickupLocation: string;
  pickupDate: string;
  pickupTime: string;
  expectedPackageCount: number;
  pickupRequestId?: string;
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

type DelhiveryWaybillPoolDoc = {
  _id?: ObjectId;
  waybill: string;
  status: "available" | "consumed";
  source: "single" | "bulk";
  createdAt: string;
  consumedAt?: string;
  consumedBy?: string;
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
    waybillFetchPath: (process.env.DELHIVERY_WAYBILL_FETCH_PATH ?? "/waybill/api/fetch/json/").trim(),
    labelPath: (process.env.DELHIVERY_LABEL_PATH ?? "/api/p/packing_slip").trim(),
    trackPath: (process.env.DELHIVERY_TRACK_PATH ?? "/api/v1/packages/json/").trim(),
    expectedTatPath: (process.env.DELHIVERY_EXPECTED_TAT_PATH ?? "/api/dc/expected_tat").trim(),
    expectedTatModeOfTransport: (process.env.DELHIVERY_EXPECTED_TAT_MOT ?? "S").trim().toUpperCase() || "S",
    expectedTatProductType: (process.env.DELHIVERY_EXPECTED_TAT_PDT ?? "B2C").trim().toUpperCase() || "B2C",
    invoiceChargesPath: (process.env.DELHIVERY_INVOICE_CHARGES_PATH ?? "/api/kinko/v1/invoice/charges/.json").trim(),
    invoiceChargesModeOfTransport: (process.env.DELHIVERY_INVOICE_DEFAULT_MD ?? "S").trim().toUpperCase() || "S",
    invoiceChargesShipmentStatus: (process.env.DELHIVERY_INVOICE_DEFAULT_SS ?? "Delivered").trim() || "Delivered",
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

export async function estimateDelhiveryCheckoutDeliveryFee(input: {
  destinationPin: string;
  paymentMethod: PaymentMethod;
  snapshot: CartSnapshot;
}): Promise<DeliveryFeeEstimate> {
  const normalizedPin = input.destinationPin.trim();
  const fallbackFee = Math.max(0, Math.round(input.snapshot.shipping));

  if (!isDelhiveryConfigured()) {
    return {
      estimatedFee: fallbackFee,
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
  const storeIds = Array.from(
    new Set(
      input.snapshot.vendors
        .map((vendor) => vendor.storeId)
        .filter((storeId) => Boolean(storeId) && storeId !== "direct"),
    ),
  );
  const originPinByStoreId = await getDelhiveryOriginPinMap(storeIds);
  const remarks = new Set<string>();
  const requestId = `dlv-quote-${crypto.randomUUID().slice(0, 8)}`;

  console.info("[Delhivery][CheckoutQuote][Start]", {
    requestId,
    destinationPin: maskPinCode(normalizedPin),
    paymentMethod: input.paymentMethod,
    vendorCount: input.snapshot.vendors.length,
    configuredMode: config.mode,
  });

  let estimatedFee = 0;
  let usedStaticFallback = false;

  for (const vendor of input.snapshot.vendors) {
    const originPin = vendor.storeId === "direct"
      ? config.defaultOriginPin
      : originPinByStoreId.get(vendor.storeId) ?? config.defaultOriginPin;

    if (!originPin) {
      const fallbackResult = await resolveLegacyVendorShippingFallback({
        destinationPin: normalizedPin,
        vendorSubtotal: vendor.subtotal,
        vendorFallbackShipping: vendor.shipping,
      });
      estimatedFee += fallbackResult.amount;
      usedStaticFallback = usedStaticFallback || fallbackResult.source === "static";

      console.warn("[Delhivery][CheckoutQuote][VendorFallback]", {
        requestId,
        storeId: vendor.storeId,
        storeName: vendor.storeName,
        reason: "ORIGIN_PIN_MISSING",
        fallbackSource: fallbackResult.source,
        amount: fallbackResult.amount,
      });
      continue;
    }

    const chargeableWeightGrams = Math.max(
      1,
      Math.round(
        vendor.lineItems.reduce((total, line) => {
          const shippingPackage = resolveShippingPackageSnapshot({
            product: line.product,
            variant: line.selectedVariant,
            quantity: line.quantity,
            fallback: config.defaultPackage,
          });

          return total + shippingPackage.deadWeightKg * shippingPackage.quantity * 1000;
        }, 0),
      ),
    );

    try {
      console.info("[Delhivery][CheckoutQuote][VendorAttempt]", {
        requestId,
        storeId: vendor.storeId,
        storeName: vendor.storeName,
        destinationPin: maskPinCode(normalizedPin),
        originPin: maskPinCode(originPin),
        chargeableWeightGrams,
        vendorSubtotal: Math.round(vendor.subtotal),
      });

      const quote = await requestDelhiveryInvoiceCharge({
        destinationPin: normalizedPin,
        originPin,
        chargeableWeightGrams,
        paymentMethod: input.paymentMethod,
      });
      estimatedFee += quote;

      console.info("[Delhivery][CheckoutQuote][VendorSuccess]", {
        requestId,
        storeId: vendor.storeId,
        storeName: vendor.storeName,
        quote,
      });
    } catch (error) {
      const fallbackResult = await resolveLegacyVendorShippingFallback({
        destinationPin: normalizedPin,
        vendorSubtotal: vendor.subtotal,
        vendorFallbackShipping: vendor.shipping,
      });
      estimatedFee += fallbackResult.amount;
      usedStaticFallback = usedStaticFallback || fallbackResult.source === "static";

      console.warn("[Delhivery][CheckoutQuote][VendorFallback]", {
        requestId,
        storeId: vendor.storeId,
        storeName: vendor.storeName,
        reason: error instanceof DelhiveryApiError ? error.code : "UNKNOWN_INVOICE_ERROR",
        fallbackSource: fallbackResult.source,
        amount: fallbackResult.amount,
      });

      if (!(error instanceof DelhiveryApiError) && error instanceof Error && isCustomerFacingDelhiveryRemark(error.message)) {
        remarks.add(error.message);
      }
    }
  }

  const finalEstimate = Math.max(0, Math.round(estimatedFee));
  const finalSource = usedStaticFallback ? "fallback" : "delhivery";

  console.info("[Delhivery][CheckoutQuote][Final]", {
    requestId,
    destinationPin: maskPinCode(normalizedPin),
    source: finalSource,
    estimatedFee: finalEstimate,
    vendorCount: input.snapshot.vendors.length,
  });

  return {
    estimatedFee: finalEstimate,
    source: finalSource,
    serviceable: true,
    remark: joinEstimateRemarks(Array.from(remarks)),
  };
}

function parseDeliveryEstimateFee(payload: unknown): number | null {
  return findNumericChargeCandidate(payload, 0);
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

async function getDelhiveryOriginPinMap(storeIds: string[]): Promise<Map<string, string>> {
  const uniqueStoreIds = Array.from(new Set(storeIds.map((value) => value.trim()).filter(Boolean)));
  const originPinByStoreId = new Map<string, string>();

  if (!uniqueStoreIds.length) {
    return originPinByStoreId;
  }

  const db = await getMongoDb();
  const stores = db.collection<StoreDoc>("stores");
  const storeDocs = await stores
    .find(
      { id: { $in: uniqueStoreIds } },
      {
        projection: {
          id: 1,
          "details.location.pincode": 1,
        },
      },
    )
    .toArray();

  for (const store of storeDocs) {
    const pincode = store.details?.location?.pincode?.trim();
    if (pincode) {
      originPinByStoreId.set(store.id, pincode);
    }
  }

  return originPinByStoreId;
}

async function requestDelhiveryInvoiceCharge(input: {
  destinationPin: string;
  originPin: string;
  chargeableWeightGrams: number;
  paymentMethod: PaymentMethod;
}) {
  const config = getDelhiveryConfig();
  const params = new URLSearchParams({
    md: config.invoiceChargesModeOfTransport,
    cgm: String(Math.max(1, Math.round(input.chargeableWeightGrams))),
    o_pin: input.originPin.trim(),
    d_pin: input.destinationPin.trim(),
    ss: config.invoiceChargesShipmentStatus,
    pt: input.paymentMethod === "cod" ? "COD" : "Pre-paid",
  });
  const url = `${config.baseUrl}${config.invoiceChargesPath}?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Token ${config.token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const body = await parseDelhiveryResponseBody(response);
  if (!response.ok) {
    throw new DelhiveryApiError(`Delhivery invoice charge lookup failed (${response.status}).`, {
      status: response.status,
      body,
      code: response.status === 401 ? "DELHIVERY_AUTH_FAILED" : "DELHIVERY_ESTIMATE_FAILED",
    });
  }

  const fee = parseDeliveryEstimateFee(body);
  if (fee === null) {
    throw new Error("Unable to parse Delhivery invoice quote.");
  }

  return fee;
}

async function resolveLegacyVendorShippingFallback(input: {
  destinationPin: string;
  vendorSubtotal: number;
  vendorFallbackShipping: number;
}) {
  if (!hasLegacyDeliveryEstimatePath()) {
    return {
      amount: input.vendorFallbackShipping,
      source: "static" as const,
    };
  }

  try {
    const legacyEstimate = await estimateDelhiveryDeliveryFee(input.destinationPin, input.vendorSubtotal);
    return {
      amount: legacyEstimate.estimatedFee,
      source: legacyEstimate.source === "delhivery" ? "legacy-delhivery" as const : "static" as const,
    };
  } catch {
    return {
      amount: input.vendorFallbackShipping,
      source: "static" as const,
    };
  }
}

function maskPinCode(pinCode: string) {
  const normalized = pinCode.trim();
  if (normalized.length <= 4) {
    return normalized;
  }

  return `${normalized.slice(0, 2)}**${normalized.slice(-2)}`;
}

function hasLegacyDeliveryEstimatePath() {
  return Boolean((process.env.DELHIVERY_CHARGE_ESTIMATE_PATH ?? "").trim());
}

function isCustomerFacingDelhiveryRemark(remark: string) {
  const normalized = remark.trim();
  if (!normalized) {
    return false;
  }

  return !isInternalDelhiveryRemark(normalized);
}

function isInternalDelhiveryRemark(remark: string) {
  return /AUTH_BYPASSED/i.test(remark)
    || /Delhivery quote unavailable/i.test(remark)
    || /Unable to parse Delhivery invoice quote/i.test(remark)
    || /Origin pincode missing/i.test(remark)
    || /validation is currently falling back/i.test(remark)
    || /timeline unavailable right now/i.test(remark);
}

function findNumericChargeCandidate(payload: unknown, depth: number): number | null {
  if (depth > 5 || payload === null || payload === undefined) {
    return null;
  }

  if (Array.isArray(payload)) {
    for (const entry of payload) {
      const nested = findNumericChargeCandidate(entry, depth + 1);
      if (nested !== null) {
        return nested;
      }
    }
    return null;
  }

  if (typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const candidates = [
    "estimated_fee",
    "total_amount",
    "total",
    "gross_amount",
    "freight_charge",
    "charges",
    "charge",
  ];

  for (const key of candidates) {
    const value = Number(record[key]);
    if (Number.isFinite(value) && value >= 0) {
      return Math.round(value);
    }
  }

  for (const value of Object.values(record)) {
    const nested = findNumericChargeCandidate(value, depth + 1);
    if (nested !== null) {
      return nested;
    }
  }

  return null;
}

function joinEstimateRemarks(remarks: string[]) {
  const normalized = Array.from(new Set(remarks.map((value) => value.trim()).filter(Boolean)));
  if (!normalized.length) {
    return undefined;
  }

  return normalized.join(" ");
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
  const sampleWaybill = await fetchDelhiveryWaybillSingle().then((result) => result.waybill).catch(() => undefined);

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
        const eventType = mappedOrderStatus
          ? `order-${mappedOrderStatus}`
          : `shipping-${status.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

        await syncOrderLifecycleEvent({
          orderRef: entry.orderRef,
          eventType,
          timelineStatus: mappedOrderStatus ?? status,
          status: entry.orderStatus,
          paymentStatus: entry.paymentStatus,
          shippingStatus: entry.shippingStatus,
          note: description,
          title: description ? "Shipping update" : undefined,
          message: description || `Order ${entry.orderRef} status changed to ${status}.`,
          adminTitle: description ? "Shipping update" : undefined,
          adminMessage: description || `Order ${entry.orderRef} status changed to ${status}.`,
          silent: !mappedOrderStatus,
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

export function isDelhiveryShipmentMutable(input: {
  providerStatus?: string;
  orderStatus?: AdminOrderDto["status"];
}) {
  const providerStatus = (input.providerStatus ?? "").trim().toLowerCase();
  const orderStatus = input.orderStatus;

  if (orderStatus === "delivered" || orderStatus === "cancelled") {
    return false;
  }

  if (!providerStatus) {
    return true;
  }

  const terminalPatterns = [
    "delivered",
    "dto",
    "rto",
    "lost",
    "closed",
    "cancel",
    "dispatched",
  ];

  if (terminalPatterns.some((pattern) => providerStatus.includes(pattern))) {
    return false;
  }

  const allowedPatterns = [
    "manifest",
    "in transit",
    "in_transit",
    "pending",
    "scheduled",
    "shipment-created",
    "pending-shipment",
  ];

  return allowedPatterns.some((pattern) => providerStatus.includes(pattern));
}

export async function updateDelhiveryShipmentByWaybill(input: {
  waybill: string;
  updates: {
    name?: string;
    phone?: string;
    add?: string;
    productsDesc?: string;
    paymentType?: "COD" | "Pre-paid";
    codAmount?: number;
    gm?: number;
    shipmentHeight?: number;
    shipmentWidth?: number;
    shipmentLength?: number;
  };
}) {
  const config = getDelhiveryConfig();
  const editPath = (process.env.DELHIVERY_SHIPMENT_EDIT_PATH ?? "/api/p/edit").trim();
  const waybill = input.waybill.trim();

  const payload: Record<string, unknown> = {
    waybill,
  };

  if (typeof input.updates.name === "string" && input.updates.name.trim()) payload.name = input.updates.name.trim();
  if (typeof input.updates.phone === "string" && input.updates.phone.trim()) payload.phone = input.updates.phone.trim();
  if (typeof input.updates.add === "string" && input.updates.add.trim()) payload.add = input.updates.add.trim();
  if (typeof input.updates.productsDesc === "string" && input.updates.productsDesc.trim()) payload.products_desc = input.updates.productsDesc.trim();
  if (typeof input.updates.paymentType === "string") payload.pt = input.updates.paymentType;
  if (typeof input.updates.codAmount === "number" && Number.isFinite(input.updates.codAmount) && input.updates.codAmount >= 0) payload.cod = Number(input.updates.codAmount.toFixed(2));
  if (typeof input.updates.gm === "number" && Number.isFinite(input.updates.gm) && input.updates.gm > 0) payload.gm = input.updates.gm;
  if (typeof input.updates.shipmentHeight === "number" && Number.isFinite(input.updates.shipmentHeight) && input.updates.shipmentHeight > 0) payload.shipment_height = input.updates.shipmentHeight;
  if (typeof input.updates.shipmentWidth === "number" && Number.isFinite(input.updates.shipmentWidth) && input.updates.shipmentWidth > 0) payload.shipment_width = input.updates.shipmentWidth;
  if (typeof input.updates.shipmentLength === "number" && Number.isFinite(input.updates.shipmentLength) && input.updates.shipmentLength > 0) payload.shipment_length = input.updates.shipmentLength;

  if (Object.keys(payload).length <= 1) {
    throw new Error("Provide at least one shipment field to update.");
  }

  const response = await fetch(`${config.baseUrl}${editPath}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${config.token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const body = await parseDelhiveryResponseBody(response);
  if (!response.ok) {
    throw new DelhiveryApiError(`Delhivery shipment update failed (${response.status}).`, {
      status: response.status,
      body,
      code: response.status === 401 || response.status === 403 ? "DELHIVERY_AUTH_FAILED" : "DELHIVERY_SHIPMENT_UPDATE_FAILED",
    });
  }

  return {
    operation: "update",
    waybill,
    accepted: true,
    providerStatus: extractFirstString(body, ["status"]) ?? extractFirstString(body, ["remarks"]),
    raw: body,
  } satisfies DelhiveryShipmentOperationResult;
}

export async function cancelDelhiveryShipmentByWaybill(waybillInput: string) {
  const config = getDelhiveryConfig();
  const editPath = (process.env.DELHIVERY_SHIPMENT_EDIT_PATH ?? "/api/p/edit").trim();
  const waybill = waybillInput.trim();

  const response = await fetch(`${config.baseUrl}${editPath}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${config.token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      waybill,
      cancellation: "true",
    }),
    cache: "no-store",
  });

  const body = await parseDelhiveryResponseBody(response);
  if (!response.ok) {
    throw new DelhiveryApiError(`Delhivery shipment cancellation failed (${response.status}).`, {
      status: response.status,
      body,
      code: response.status === 401 || response.status === 403 ? "DELHIVERY_AUTH_FAILED" : "DELHIVERY_SHIPMENT_CANCEL_FAILED",
    });
  }

  return {
    operation: "cancel",
    waybill,
    accepted: true,
    providerStatus: extractFirstString(body, ["status"]) ?? extractFirstString(body, ["remarks"]),
    raw: body,
  } satisfies DelhiveryShipmentOperationResult;
}

export async function updateDelhiveryEwaybill(input: {
  waybill: string;
  dcn: string;
  ewbn: string;
}) {
  const config = getDelhiveryConfig();
  const ewaybillPathTemplate = (process.env.DELHIVERY_EWAYBILL_UPDATE_PATH_TEMPLATE ?? "/api/rest/ewaybill/{waybill}/").trim();
  const waybill = input.waybill.trim();
  const path = ewaybillPathTemplate.replace("{waybill}", encodeURIComponent(waybill));

  const response = await fetch(`${config.baseUrl}${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Token ${config.token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [
        {
          dcn: input.dcn.trim(),
          ewbn: input.ewbn.trim(),
        },
      ],
    }),
    cache: "no-store",
  });

  const body = await parseDelhiveryResponseBody(response);
  if (!response.ok) {
    throw new DelhiveryApiError(`Delhivery e-waybill update failed (${response.status}).`, {
      status: response.status,
      body,
      code: response.status === 401 || response.status === 403 ? "DELHIVERY_AUTH_FAILED" : "DELHIVERY_EWAYBILL_UPDATE_FAILED",
    });
  }

  return {
    operation: "update",
    waybill,
    accepted: true,
    providerStatus: extractFirstString(body, ["status"]) ?? extractFirstString(body, ["remarks"]),
    raw: body,
  } satisfies DelhiveryShipmentOperationResult;
}

export async function generateDelhiveryShippingLabel(input: {
  waybill: string;
  pdf?: boolean;
  pdfSize?: "A4" | "4R";
}) {
  const config = getDelhiveryConfig();
  const waybill = input.waybill.trim();
  const pdf = input.pdf ?? true;
  const pdfSize = input.pdfSize ?? "4R";

  const params = new URLSearchParams({
    wbns: waybill,
    pdf: String(pdf),
    pdf_size: pdfSize,
  });

  const response = await fetch(`${config.baseUrl}${config.labelPath}?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Token ${config.token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const body = await parseDelhiveryResponseBody(response);
  if (!response.ok) {
    throw new DelhiveryApiError(`Delhivery shipping label generation failed (${response.status}).`, {
      status: response.status,
      body,
      code: response.status === 401 || response.status === 403 ? "DELHIVERY_AUTH_FAILED" : "DELHIVERY_LABEL_FAILED",
    });
  }

  const labelUrl = findFirstUrl(body);

  return {
    waybill,
    pdf,
    pdfSize,
    ...(labelUrl ? { labelUrl } : {}),
    ...(!labelUrl ? { labelData: body } : {}),
    raw: body,
  } satisfies DelhiveryShippingLabelResult;
}

export async function fetchDelhiveryWaybillSingle() {
  const config = getDelhiveryConfig();
  const params = new URLSearchParams({ token: config.token });
  const response = await fetch(`${config.baseUrl}${config.waybillFetchPath}?${params.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const data = await parseDelhiveryResponseBody(response);
  if (!response.ok) {
    throw new DelhiveryApiError(`Unable to fetch Delhivery waybill (${response.status}).`, {
      status: response.status,
      body: data,
      code: response.status === 401 || response.status === 403 ? "DELHIVERY_AUTH_FAILED" : "DELHIVERY_WAYBILL_FETCH_FAILED",
    });
  }

  const waybill = extractStringArray(data)[0] ?? extractFirstString(data, ["waybill"]);
  if (!waybill) {
    throw new Error("Delhivery single waybill response did not include a waybill.");
  }

  return {
    waybill,
    raw: data,
  };
}

export async function fetchDelhiveryWaybillsBulk(requestedCount: number) {
  const config = getDelhiveryConfig();
  const count = Math.max(1, Math.min(10000, Math.floor(requestedCount)));
  const params = new URLSearchParams({
    count: String(count),
    token: config.token,
  });

  const response = await fetch(`${config.baseUrl}${config.waybillPath}?${params.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const data = await parseDelhiveryResponseBody(response);
  if (!response.ok) {
    throw new DelhiveryApiError(`Unable to fetch Delhivery bulk waybills (${response.status}).`, {
      status: response.status,
      body: data,
      code: response.status === 401 || response.status === 403 ? "DELHIVERY_AUTH_FAILED" : "DELHIVERY_WAYBILL_BULK_FAILED",
    });
  }

  return {
    count,
    waybills: extractStringArray(data),
    raw: data,
  };
}

export async function persistDelhiveryWaybills(input: {
  waybills: string[];
  source: "single" | "bulk";
}) {
  const uniqueWaybills = Array.from(
    new Set(
      input.waybills
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );

  if (!uniqueWaybills.length) {
    return {
      insertedCount: 0,
      skippedCount: 0,
      totalRequested: 0,
    };
  }

  const db = await getMongoDb();
  const collection = db.collection<DelhiveryWaybillPoolDoc>("delhivery_waybill_pool");
  await collection.createIndex({ waybill: 1 }, { unique: true });

  let insertedCount = 0;
  for (const waybill of uniqueWaybills) {
    const result = await collection.updateOne(
      { waybill },
      {
        $setOnInsert: {
          waybill,
          status: "available",
          source: input.source,
          createdAt: new Date().toISOString(),
        },
      },
      { upsert: true },
    );

    if (result.upsertedCount > 0) {
      insertedCount += 1;
    }
  }

  return {
    insertedCount,
    skippedCount: uniqueWaybills.length - insertedCount,
    totalRequested: uniqueWaybills.length,
  };
}

async function consumeDelhiveryWaybillFromPool() {
  const db = await getMongoDb();
  const collection = db.collection<DelhiveryWaybillPoolDoc>("delhivery_waybill_pool");

  const result = await collection.findOneAndUpdate(
    { status: "available" },
    {
      $set: {
        status: "consumed",
        consumedAt: new Date().toISOString(),
        consumedBy: "shipment_creation",
      },
    },
    {
      sort: { createdAt: 1 },
      returnDocument: "after",
    },
  );

  return result?.waybill?.trim() || undefined;
}

export async function scheduleDelhiveryPickup(input: {
  pickupLocation: string;
  expectedPackageCount: number;
  pickupDate: string;
  pickupTime: string;
}) {
  const config = getDelhiveryConfig();
  const pickupLocation = input.pickupLocation.trim();
  const pickupDate = input.pickupDate.trim();
  const pickupTime = input.pickupTime.trim();
  const expectedPackageCount = Math.max(1, Math.floor(input.expectedPackageCount));

  const response = await fetch(`${config.baseUrl}${config.pickupRequestPath}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${config.token}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      pickup_location: pickupLocation,
      expected_package_count: String(expectedPackageCount),
      pickup_date: pickupDate,
      pickup_time: pickupTime,
    }),
    cache: "no-store",
  });

  const data = await parseDelhiveryResponseBody(response);
  if (!response.ok) {
    throw new DelhiveryApiError(`Unable to create Delhivery pickup request (${response.status}).`, {
      status: response.status,
      body: data,
      code: response.status === 401 || response.status === 403 ? "DELHIVERY_AUTH_FAILED" : "DELHIVERY_PICKUP_FAILED",
    });
  }

  return {
    pickupLocation,
    pickupDate,
    pickupTime,
    expectedPackageCount,
    pickupRequestId: extractFirstString(data, ["pickup_id"])
      ?? extractFirstString(data, ["request_id"])
      ?? extractFirstString(data, ["id"]),
    raw: data,
  } satisfies DelhiveryPickupScheduleResult;
}

async function createDelhiveryShipment(input: ShipmentCreateInput): Promise<ShipmentCreateResult> {
  const config = getDelhiveryConfig();
  const waybill = await consumeDelhiveryWaybillFromPool()
    .then((reserved) => reserved || fetchDelhiveryWaybillSingle().then((result) => result.waybill))
    .catch(() => undefined);

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

async function createPickupRequest(input: { pickupLocation: string; expectedPackageCount: number }) {
  const now = new Date();
  const pickupDate = now.toISOString().slice(0, 10);
  const pickupTime = `${String(now.getHours()).padStart(2, "0")}:00:00`;

  return scheduleDelhiveryPickup({
    pickupLocation: input.pickupLocation,
    expectedPackageCount: input.expectedPackageCount,
    pickupDate,
    pickupTime,
  }).then((result) => result.pickupRequestId);
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

function findFirstUrl(payload: unknown): string | undefined {
  if (!payload) {
    return undefined;
  }

  if (typeof payload === "string") {
    return /^https?:\/\//i.test(payload) ? payload : undefined;
  }

  if (Array.isArray(payload)) {
    for (const entry of payload) {
      const found = findFirstUrl(entry);
      if (found) {
        return found;
      }
    }
    return undefined;
  }

  if (typeof payload !== "object") {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    if ((key.toLowerCase().includes("url") || key.toLowerCase().includes("link")) && typeof value === "string" && /^https?:\/\//i.test(value)) {
      return value;
    }
  }

  for (const value of Object.values(record)) {
    const found = findFirstUrl(value);
    if (found) {
      return found;
    }
  }

  return undefined;
}
