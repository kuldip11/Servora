/**
 * Menu category controller — thin handlers only. Auth/branch resolution
 * comes from `requireAuthPlugin` (applied in `category.route.ts`);
 * business rules live in `category.service.ts`.
 */
import type { AuthContext } from "../../../core/auth";
import { successResponse, createdResponse } from "../../../core/response";
import {
  categoryService,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "./category.service";

export const categoryController = {
  async list(auth: AuthContext) {
    const categories = await categoryService.list(auth);
    return successResponse(categories);
  },

  async create(auth: AuthContext, input: CreateCategoryInput) {
    const category = await categoryService.create(auth, input);
    return createdResponse(category);
  },

  async update(
    auth: AuthContext,
    categoryId: string,
    input: UpdateCategoryInput,
  ) {
    const category = await categoryService.update(auth, categoryId, input);
    return successResponse(category);
  },

  async deactivate(auth: AuthContext, categoryId: string) {
    await categoryService.deactivate(auth, categoryId);
    return successResponse(null);
  },
};
