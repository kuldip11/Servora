import { z } from 'zod';
export const createMenuTagSchema = z.object({ name: z.string().trim().min(1, 'Tag name is required').max(50), color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Choose a valid color') });
export const createHolidaySchema = z.object({ name: z.string().trim().min(1, 'Holiday name is required').max(100), holidayDate: z.string().min(1, 'Date is required'), region: z.string().trim().max(100).optional() });
export const applyTemplateSchema = z.object({ branchId: z.string(), categoryName: z.string().trim().min(1, 'Category name is required').max(100) });
export const saveTemplateSchema = z.object({ name: z.string().trim().min(1, 'Template name is required').max(100), description: z.string().trim().max(500).optional() });
export type CreateMenuTagInput = z.infer<typeof createMenuTagSchema>;
export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;
export type ApplyTemplateInput = z.infer<typeof applyTemplateSchema>;
export type SaveTemplateInput = z.infer<typeof saveTemplateSchema>;
