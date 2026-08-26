import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
/** Form-level schema for the web Branch create/edit dialog. */
export const branchFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Branch name is required")
      .max(150, "Branch name must be 150 characters or fewer"),
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
