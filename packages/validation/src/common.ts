import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const branchFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Branch name is required")
      .max(150, "Branch name must be 150 characters or fewer"),
    code: z
      .string()
      .trim()
      .min(2, "Branch code must be at least 2 characters")
      .max(24, "Branch code must be 24 characters or fewer")
      .regex(/^[A-Za-z0-9-]+$/, "Use only letters, numbers, and hyphens")
      .transform((value) => value.toUpperCase()),
    timezone: z.string().trim().min(1, "Timezone is required").max(64),
    currency: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{3}$/, "Use a 3-letter currency code")
      .transform((value) => value.toUpperCase()),
    address: z.string().max(500, "Address must be 500 characters or fewer"),
    phone: z.string().max(30, "Phone must be 30 characters or fewer"),
    dineInEnabled: z.boolean(),
    takeawayEnabled: z.boolean(),
    deliveryEnabled: z.boolean(),
    onlineEnabled: z.boolean(),
    tablesEnabled: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (!value.dineInEnabled && value.tablesEnabled) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tablesEnabled"],
        message: "Tables require dine-in to be enabled",
      });
    }
    if (!value.dineInEnabled && value.tablesEnabled) {
      return;
    }
    if (
      !value.dineInEnabled &&
      !value.takeawayEnabled &&
      !value.deliveryEnabled &&
      !value.onlineEnabled
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: "Select at least one order type",
      });
    }
  });

export type BranchFormValues = z.infer<typeof branchFormSchema>;
