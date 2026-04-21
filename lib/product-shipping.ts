import { ShippingPackageSnapshot } from "@/types/api";
import {
  Product,
  ProductDimensionUnit,
  ProductShippingSpec,
  ProductVariant,
  ProductWeightUnit,
} from "@/types/ecommerce";

export const PRODUCT_WEIGHT_UNIT_OPTIONS: ProductWeightUnit[] = ["g", "kg", "oz", "lb"];

export const PRODUCT_DIMENSION_UNIT_OPTIONS: ProductDimensionUnit[] = ["mm", "cm", "m", "in", "ft"];

type ShippingSpecLike = Pick<ProductShippingSpec, "weight" | "weightUnit" | "length" | "width" | "height" | "dimensionUnit">;

export function normalizeProductWeightUnit(value: unknown): ProductWeightUnit | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (["g", "gram", "grams"].includes(normalized)) {
    return "g";
  }

  if (["kg", "kgs", "kilogram", "kilograms"].includes(normalized)) {
    return "kg";
  }

  if (["oz", "ounce", "ounces"].includes(normalized)) {
    return "oz";
  }

  if (["lb", "lbs", "pound", "pounds"].includes(normalized)) {
    return "lb";
  }

  return undefined;
}

export function normalizeProductDimensionUnit(value: unknown): ProductDimensionUnit | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (["mm", "millimeter", "millimeters"].includes(normalized)) {
    return "mm";
  }

  if (["cm", "centimeter", "centimeters"].includes(normalized)) {
    return "cm";
  }

  if (["m", "meter", "meters"].includes(normalized)) {
    return "m";
  }

  if (["in", "inch", "inches"].includes(normalized)) {
    return "in";
  }

  if (["ft", "foot", "feet"].includes(normalized)) {
    return "ft";
  }

  return undefined;
}

export function sanitizeProductShippingSpec(input: ShippingSpecLike): ProductShippingSpec {
  const weight = normalizeNonNegativeNumber(input.weight);
  const length = normalizeNonNegativeNumber(input.length);
  const width = normalizeNonNegativeNumber(input.width);
  const height = normalizeNonNegativeNumber(input.height);

  const normalized: ProductShippingSpec = {};

  if (weight !== undefined) {
    normalized.weight = weight;
    normalized.weightUnit = normalizeProductWeightUnit(input.weightUnit) ?? "g";
  }

  if (length !== undefined) {
    normalized.length = length;
  }

  if (width !== undefined) {
    normalized.width = width;
  }

  if (height !== undefined) {
    normalized.height = height;
  }

  if (length !== undefined || width !== undefined || height !== undefined) {
    normalized.dimensionUnit = normalizeProductDimensionUnit(input.dimensionUnit) ?? "cm";
  }

  return normalized;
}

export function resolveShippingPackageSnapshot(input: {
  product: Pick<Product, "weight" | "weightUnit" | "length" | "width" | "height" | "dimensionUnit">;
  variant?: Pick<ProductVariant, "weight" | "weightUnit" | "length" | "width" | "height" | "dimensionUnit">;
  quantity: number;
  fallback: ShippingPackageSnapshot;
}): ShippingPackageSnapshot {
  const variant = input.variant;
  const product = input.product;

  const deadWeightKg =
    convertWeightToKg(variant?.weight, variant?.weightUnit)
    ?? convertWeightToKg(product.weight, product.weightUnit)
    ?? input.fallback.deadWeightKg;
  const lengthCm =
    convertDimensionToCm(variant?.length, variant?.dimensionUnit)
    ?? convertDimensionToCm(product.length, product.dimensionUnit)
    ?? input.fallback.lengthCm;
  const breadthCm =
    convertDimensionToCm(variant?.width, variant?.dimensionUnit)
    ?? convertDimensionToCm(product.width, product.dimensionUnit)
    ?? input.fallback.breadthCm;
  const heightCm =
    convertDimensionToCm(variant?.height, variant?.dimensionUnit)
    ?? convertDimensionToCm(product.height, product.dimensionUnit)
    ?? input.fallback.heightCm;

  return {
    deadWeightKg: roundMetric(deadWeightKg),
    lengthCm: roundMetric(lengthCm),
    breadthCm: roundMetric(breadthCm),
    heightCm: roundMetric(heightCm),
    quantity: Math.max(1, Math.floor(input.quantity)),
  };
}

function normalizeNonNegativeNumber(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.max(0, value);
}

function convertWeightToKg(value: number | undefined, unit: ProductWeightUnit | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  switch (unit) {
    case "g":
      return value / 1000;
    case "kg":
      return value;
    case "oz":
      return value * 0.028349523125;
    case "lb":
      return value * 0.45359237;
    default:
      return undefined;
  }
}

function convertDimensionToCm(value: number | undefined, unit: ProductDimensionUnit | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  switch (unit) {
    case "mm":
      return value / 10;
    case "cm":
      return value;
    case "m":
      return value * 100;
    case "in":
      return value * 2.54;
    case "ft":
      return value * 30.48;
    default:
      return undefined;
  }
}

function roundMetric(value: number) {
  return Number(value.toFixed(3));
}