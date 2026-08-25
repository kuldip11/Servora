import { z } from 'zod';

export const createStaffSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  roleId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
});

export const updateStaffSchema = createStaffSchema
  .partial()
  .omit({
    password: true,
  });

export type CreateStaffInput = z.infer<
  typeof createStaffSchema
>;