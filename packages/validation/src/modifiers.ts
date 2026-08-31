import { z } from "zod";

const modifierOptionFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .trim()
    .min(1, "Option name is required")
    .max(100, "Option name must be 100 characters or fewer"),
  additionalPrice: z
    .string()
    .refine(
      (value) => Number.isFinite(Number(value)),
      "Price must be a number",
    ),
  maxQuantity: z
    .string()
    .refine(
      (value) =>
        Number.isInteger(Number(value)) &&
        Number(value) >= 1 &&
        Number(value) <= 100,
      "Quantity must be a whole number between 1 and 100",
    ),
  isDefault: z.boolean().optional(),
  replacesDefaultComponent: z.string().optional(),
});

export const modifierGroupFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Group name is required")
      .max(100, "Group name must be 100 characters or fewer"),
    selectionType: z.enum(["SINGLE", "MULTIPLE"]),
    groupType: z.enum(["ADDON", "SUBSTITUTION"]).default("ADDON"),
    minSelections: z
      .string()
      .refine(
        (value) =>
          Number.isInteger(Number(value)) &&
          Number(value) >= 0 &&
          Number(value) <= 100,
        "Minimum must be a whole number from 0 to 100",
      ),
    maxSelections: z
      .string()
      .refine(
        (value) =>
          value === "" ||
          (Number.isInteger(Number(value)) &&
            Number(value) >= 1 &&
            Number(value) <= 100),
        "Maximum must be blank or a whole number from 1 to 100",
      ),
    dependsOnOptionId: z.string().nullable().optional(),
    options: z
      .array(modifierOptionFormSchema)
      .min(1, "Add at least one modifier option"),
  })
  .superRefine((value, ctx) => {
    const min = Number(value.minSelections);
    const max =
      value.maxSelections === "" ? undefined : Number(value.maxSelections);
    if (max !== undefined && max < min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxSelections"],
        message: "Maximum cannot be less than minimum",
      });
    }
    if (value.selectionType === "SINGLE" && max !== undefined && max > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxSelections"],
        message: "Pick one groups cannot allow more than 1 option",
      });
    }
    if (value.groupType === "ADDON")
      value.options.forEach((option, index) => {
        if (Number(option.additionalPrice) < 0)
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["options", index, "additionalPrice"],
            message: "Addon prices cannot be negative",
          });
      });
  });

export type ModifierGroupFormValues = z.infer<typeof modifierGroupFormSchema>;
