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

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  preferences: z
    .object({
      occasions: z.array(z.enum(categories)).optional(),
      budgetMin: z.number().min(0).optional(),
      budgetMax: z.number().min(0).optional(),
      preferredTags: z.array(z.string().trim().min(1)).optional(),
    })
    .optional(),
  addresses: z
    .array(
      z.object({
        label: z.string().trim().min(1),
        receiverName: z.string().trim().min(2),
        receiverPhone: z.string().trim().min(7).max(20),
        line1: z.string().trim().min(1),
        city: z.string().trim().min(1),
        state: z.string().trim().min(1),
        pinCode: z.string().trim().min(3),
        country: z.string().trim().min(2),
      }),
    )
    .optional(),
});
