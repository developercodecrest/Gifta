import { z } from "zod";
import { categories } from "@/lib/catalog";
import { SortOption } from "@/types/api";

const toOptionalNumber = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
}, z.number().optional());

const toOptionalBoolean = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === true || value === false) return value;
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return value;
}, z.boolean().optional());

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  category: z.enum(categories).optional(),
  tag: z.string().trim().min(1).optional(),
  sort: z.enum(["featured", "price-asc", "price-desc", "rating"] as [SortOption, ...SortOption[]]).default("featured"),
  stock: toOptionalBoolean,
  page: toOptionalNumber.pipe(z.number().int().min(1).default(1)),
  pageSize: toOptionalNumber.pipe(z.number().int().min(1).max(50).default(8)),
  minPrice: toOptionalNumber.pipe(z.number().min(0).optional()),
  maxPrice: toOptionalNumber.pipe(z.number().min(0).optional()),
  storeId: z.string().trim().min(1).optional(),
  minRating: toOptionalNumber.pipe(z.number().min(0).max(5).optional()),
});

export const paginationQuerySchema = z.object({
  page: toOptionalNumber.pipe(z.number().int().min(1).default(1)),
  pageSize: toOptionalNumber.pipe(z.number().int().min(1).max(50).default(10)),
});

export const suggestionQuerySchema = z.object({
  q: z.string().trim().min(1),
  limit: toOptionalNumber.pipe(z.number().int().min(1).max(10).default(10)),
});

const optionalString = z.string().trim().optional().default("");

const timeSlotSchema = z.object({
  day: z.string().trim().min(1),
  start: z.string().trim().min(1),
  end: z.string().trim().min(1),
});

const storeCategorySchema = z.object({
  name: z.string().trim().min(1),
  subcategories: z.array(z.string().trim().min(1)).default([]),
});

export const createStoreSchema = z.object({
  store: z.object({
    basicInfo: z.object({
      name: z.string().trim().min(2),
      slug: optionalString,
      logo: optionalString,
      banner: optionalString,
      shortDescription: optionalString,
      longDescription: optionalString,
      category: z.string().trim().min(1),
      subcategory: optionalString,
    }),
    owner: z.object({
      fullName: optionalString,
      email: z.string().trim().email().optional().or(z.literal("")),
      phone: optionalString,
      alternatePhone: optionalString,
      profileImage: optionalString,
    }),
    business: z.object({
      businessType: z.enum(["individual", "partnership", "llp", "private_limited", "public_limited", "other"]).default("individual"),
      legalName: optionalString,
      gstNumber: optionalString,
      panNumber: optionalString,
      fssaiLicense: optionalString,
      drugLicense: optionalString,
      shopActLicense: optionalString,
    }),
    location: z.object({
      addressLine1: optionalString,
      addressLine2: optionalString,
      landmark: optionalString,
      city: optionalString,
      state: optionalString,
      pincode: optionalString,
      country: optionalString.default("India"),
      geo: z.object({
        latitude: z.number().nullable().optional(),
        longitude: z.number().nullable().optional(),
      }),
    }),
    delivery: z.object({
      isPickupAvailable: z.boolean().default(false),
      deliveryRadiusKm: z.number().min(0).default(0),
      deliveryChargeType: z.enum(["fixed", "dynamic", "range"]).default("fixed"),
      deliveryCharge: z.number().min(0).default(0),
      minDeliveryCharge: z.number().min(0).default(0),
      maxDeliveryCharge: z.number().min(0).default(0),
      estimatedDeliveryTimeMinutes: z.number().int().min(0).default(0),
      timeSlots: z.array(timeSlotSchema).default([]),
    }).optional(),
    payment: z.object({
      accountHolderName: optionalString,
      accountNumber: optionalString,
      ifscCode: optionalString,
      upiId: optionalString,
      bankProofImage: optionalString,
    }).optional(),
    productSettings: z.object({
      defaultTaxRate: z.number().min(0).max(100).default(0),
      measurementUnits: z.array(z.string().trim().min(1)).default(["kg", "piece", "liter"]),
      minOrderValue: z.number().min(0).default(0),
      returnPolicy: optionalString,
      replacementPolicy: optionalString,
    }),
    operations: z.object({
      workingDays: z.array(z.string().trim().min(1)).default(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
      openingTime: z.string().trim().min(1).default("09:00"),
      closingTime: z.string().trim().min(1).default("21:00"),
      holidayMode: z.boolean().default(false),
      orderPreparationTimeMinutes: z.number().int().min(0).default(30),
    }),
    media: z.object({
      gallery: z.array(z.string().trim().url()).default([]),
      introVideo: optionalString,
    }),
    catalog: z.object({
      categories: z.array(storeCategorySchema).default([]),
    }).optional(),
    marketing: z.object({
      couponsEnabled: z.boolean().default(true),
      featured: z.boolean().default(false),
      adBudget: z.number().min(0).default(0),
    }),
    aiInsights: z.object({
      pricingSuggestionsEnabled: z.boolean().default(true),
      inventoryAlertsEnabled: z.boolean().default(true),
      salesInsightsEnabled: z.boolean().default(true),
      complianceAlertsEnabled: z.boolean().default(true),
      productRecommendationsEnabled: z.boolean().default(true),
    }),
    meta: z.object({
      status: z.enum(["pending", "active", "inactive", "rejected"]).default("pending"),
      isVerified: z.boolean().default(false),
      profileCompletion: z.number().min(0).max(100).default(0),
      createdAt: optionalString,
      updatedAt: optionalString,
    }),
  }),
});
