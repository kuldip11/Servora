import { z } from "zod";

const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max);
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));
const countryCode = z
  .string()
  .trim()
  .length(2, "Use a 2-letter country code")
  .transform((value) => value.toUpperCase());
const currencyCode = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{3}$/, "Use a 3-letter currency code")
  .transform((value) => value.toUpperCase());
const email = z.string().trim().email("Enter a valid email").max(255);
const phone = requiredText("Phone", 30);
const percentage = z.coerce.number().min(0).max(100);

export const organizationBusinessTypes = [
  "RESTAURANT_GROUP",
  "INDEPENDENT_RESTAURANT",
  "HOSPITALITY_GROUP",
  "CLOUD_KITCHEN_GROUP",
  "CAFE_GROUP",
  "QSR_GROUP",
  "FOOD_SERVICE_COMPANY",
  "OTHER",
] as const;

export const franchiseBusinessModels = [
  "RESTAURANT",
  "CAFE",
  "CLOUD_KITCHEN",
  "QSR",
  "FINE_DINING",
  "FOOD_COURT",
  "BAKERY",
  "BAR_PUB",
  "OTHER",
] as const;

export const organizationBusinessFormSchema = z.object({
  name: requiredText("Organization / Business name", 200),
  businessType: z.enum(organizationBusinessTypes),
  country: countryCode,
  timezone: requiredText("Timezone", 64),
  currency: currencyCode,
  primaryContactName: requiredText("Primary contact name", 150),
  businessEmail: email,
  businessPhone: phone,
  addressLine1: requiredText("Address line 1", 300),
  city: requiredText("City", 120),
  stateProvince: requiredText("State / Province", 120),
  postalCode: requiredText("Postal code", 24),
  legalName: optionalText(200),
  addressLine2: optionalText(300),
  website: z
    .string()
    .trim()
    .url("Enter a valid website URL")
    .max(500)
    .optional()
    .or(z.literal("")),
  taxRegistrationNumber: optionalText(100),
  gstin: z
    .string()
    .trim()
    .regex(/^[0-9A-Z]{15}$/, "GSTIN must be 15 uppercase letters/numbers")
    .optional()
    .or(z.literal("")),
  pan: z
    .string()
    .trim()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Enter a valid PAN")
    .optional()
    .or(z.literal("")),
  companyRegistrationNumber: optionalText(100),
  logoUrl: z
    .string()
    .trim()
    .url("Enter a valid logo URL")
    .max(1000)
    .optional()
    .or(z.literal("")),
});

export const franchiseBusinessFormSchema = z.object({
  name: requiredText("Franchise / Brand name", 200),
  cuisineTypes: z
    .array(requiredText("Cuisine type", 80))
    .min(1, "Select at least one cuisine type")
    .max(20),
  businessModel: z.enum(franchiseBusinessModels),
  defaultTaxMode: z.enum(["INCLUSIVE", "EXCLUSIVE"]),
  defaultCurrency: currencyCode,
  defaultTimezone: requiredText("Default timezone", 64),
  dineInEnabled: z.boolean(),
  takeawayEnabled: z.boolean(),
  deliveryEnabled: z.boolean(),
  customerQrEnabled: z.boolean(),
  tableManagementEnabled: z.boolean(),
  kdsEnabled: z.boolean(),
  waiterServiceEnabled: z.boolean(),
  displayName: optionalText(200),
  description: optionalText(2000),
  supportEmail: email.optional().or(z.literal("")),
  supportPhone: optionalText(30),
  website: z
    .string()
    .trim()
    .url("Enter a valid website URL")
    .max(500)
    .optional()
    .or(z.literal("")),
  logoUrl: z
    .string()
    .trim()
    .url("Enter a valid logo URL")
    .max(1000)
    .optional()
    .or(z.literal("")),
  primaryBrandImageUrl: z
    .string()
    .trim()
    .url("Enter a valid image URL")
    .max(1000)
    .optional()
    .or(z.literal("")),
  defaultTaxRate: percentage.optional().nullable(),
  serviceChargePercent: percentage.optional().nullable(),
  serviceChargeTaxable: z.boolean().optional(),
  roundingPolicy: z
    .enum(["NONE", "NEAREST_1", "NEAREST_5", "NEAREST_10"])
    .optional(),
  courseSequencingEnabled: z.boolean().optional(),
});

export const businessBranchFormSchema = z
  .object({
    name: requiredText("Branch name", 200),
    code: z
      .string()
      .trim()
      .min(2)
      .max(24)
      .regex(/^[A-Za-z0-9-]+$/, "Use only letters, numbers, and hyphens")
      .transform((value) => value.toUpperCase()),
    status: z.enum(["ACTIVE", "INACTIVE"]),
    addressLine1: requiredText("Address line 1", 300),
    addressLine2: optionalText(300),
    city: requiredText("City", 120),
    stateProvince: requiredText("State", 120),
    postalCode: requiredText("Postal code", 24),
    country: countryCode,
    timezone: requiredText("Timezone", 64),
    phone,
    dineInEnabled: z.boolean(),
    takeawayEnabled: z.boolean(),
    deliveryEnabled: z.boolean(),
    customerQrEnabled: z.boolean(),
    tablesEnabled: z.boolean(),
    kdsEnabled: z.boolean(),
    waiterAppEnabled: z.boolean(),
    managerName: optionalText(150),
    email: email.optional().or(z.literal("")),
    openingTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm")
      .optional()
      .or(z.literal("")),
    closingTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm")
      .optional()
      .or(z.literal("")),
    weeklyOperatingDays: z
      .array(z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]))
      .optional(),
    taxOverride: percentage.optional().nullable(),
    serviceChargeOverride: percentage.optional().nullable(),
    invoicePrefix: optionalText(30),
    receiptFooter: optionalText(1000),
    inventoryTrackingEnabled: z.boolean().optional(),
    negativeStockPolicy: z.enum(["BLOCK", "ALLOW", "WARN"]).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.dineInEnabled && value.tablesEnabled) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tablesEnabled"],
        message: "Table management requires dine-in to be enabled",
      });
    }
    if (
      !value.dineInEnabled &&
      !value.takeawayEnabled &&
      !value.deliveryEnabled
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: "Enable at least one fulfillment type",
      });
    }
  });

export type OrganizationBusinessFormValues = z.infer<
  typeof organizationBusinessFormSchema
>;
export type FranchiseBusinessFormValues = z.infer<
  typeof franchiseBusinessFormSchema
>;
export type BusinessBranchFormValues = z.infer<typeof businessBranchFormSchema>;
