import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  value: number | string | null | undefined,
  options?: {
    currency?: string
    locale?: string
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  }
) {
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return "N/A"
  }

  const formatter = new Intl.NumberFormat(options?.locale ?? "en-IN", {
    style: "currency",
    currency: options?.currency ?? "INR",
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  })

  return formatter.format(amount)
}
