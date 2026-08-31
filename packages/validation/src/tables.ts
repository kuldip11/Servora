import { z } from "zod";

export const createTableSchema = z.object({
  name: z.string().min(1).max(50),
  capacity: z.number().int().min(1).max(100),
  section: z.string().max(50).optional(),
  branchId: z.string().uuid(),
});

export const tableFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Table name is required")
    .max(50, "Table name must be 50 characters or fewer"),
  capacity: z
    .string()
    .min(1, "Capacity is required")
    .refine((value) => {
      const number = Number(value);
      return Number.isInteger(number) && number >= 1 && number <= 100;
    }, "Capacity must be a whole number between 1 and 100"),
  section: z.string().max(50, "Section must be 50 characters or fewer"),
  branchId: z.string().uuid("Select a branch").or(z.literal("")),
});

export const updateTableStatusSchema = z.object({
  status: z.enum(["AVAILABLE", "OCCUPIED", "CLEANING", "RESERVED"]),
});
