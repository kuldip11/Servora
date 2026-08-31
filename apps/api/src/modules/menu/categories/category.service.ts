/**
 * Menu category service — orchestrates `category.repository.ts` and
 * applies category business rules, including:
 * draft visibility by role, branch resolution on create, and the
 * "blocked while items exist" guard on delete (deactivate).
 */
import type { AuthContext } from "../../../core/auth";
import { categoryRepository } from "./category.repository";
import { categoryNotFound, categoryHasItems } from "./category.errors";
import { requirePermission } from "../../../core/auth";
import {
  assertMenuResourceBranch,
  resolveMenuBranch,
} from "../menu-authorization";
import { buildDiff, menuChangeLog } from "../change-log/menu-change-log";

export interface CreateCategoryInput {
  name: string;
  description?: string | undefined;
  sortOrder?: number | undefined;
  branchId?: string | undefined;
}

export interface UpdateCategoryInput {
  name?: string | undefined;
  description?: string | undefined;
  sortOrder?: number | undefined;
}

export const categoryService = {
  // Drafts are only ever visible to roles that manage the menu — every
  // other role (waiters, kitchen, cashiers) only ever sees the live,
  // published menu, same as a customer would.
  async list(auth: AuthContext) {
    requirePermission(auth, "menu:read");
    resolveMenuBranch(auth);
    const canSeeDrafts = auth.permissions.includes("menu:update");
    return categoryRepository.findMany(
      auth.tenantId,
      auth.branchId,
      canSeeDrafts,
    );
  },

  // No explicit branchId in the input -> falls back to whatever branch
  // context the request was made in. No resolved branch (aggregate view,
  // "All Branches") -> creates a tenant-wide shared category.
  async create(auth: AuthContext, input: CreateCategoryInput) {
    requirePermission(auth, "menu:create");
    const branchId = resolveMenuBranch(auth, input.branchId);
    const created = await categoryRepository.create({
      tenantId: auth.tenantId,
      ...input,
      branchId,
    });
    await menuChangeLog.record(auth, "CATEGORY", created.id, "CREATED", buildDiff(null, created));
    return created;
  },

  async update(
    auth: AuthContext,
    categoryId: string,
    input: UpdateCategoryInput,
  ) {
    requirePermission(auth, "menu:update");
    const existing = await categoryRepository.findById(
      auth.tenantId,
      categoryId,
    );
    if (!existing) throw categoryNotFound(categoryId);
    assertMenuResourceBranch(auth, existing.branchId);
    const updated = await categoryRepository.update(
      auth.tenantId,
      categoryId,
      input,
    );
    if (!updated) throw categoryNotFound(categoryId);
    await menuChangeLog.record(auth, "CATEGORY", categoryId, "UPDATED", buildDiff(existing, updated));
    return updated;
  },

  // Deactivate rather than delete — a category with items in it should
  // never silently cascade-delete those items. Blocked entirely if it
  // still has active items; the owner has to move or remove them first.
  async deactivate(auth: AuthContext, categoryId: string) {
    requirePermission(auth, "menu:delete");
    const existing = await categoryRepository.findById(
      auth.tenantId,
      categoryId,
    );
    if (!existing) throw categoryNotFound(categoryId);
    assertMenuResourceBranch(auth, existing.branchId);
    const itemCount = await categoryRepository.itemCount(
      auth.tenantId,
      categoryId,
    );
    if (itemCount > 0) throw categoryHasItems(itemCount);

    const updated = await categoryRepository.update(auth.tenantId, categoryId, {
      isActive: false,
    });
    if (!updated) throw categoryNotFound(categoryId);
    await menuChangeLog.record(auth, "CATEGORY", categoryId, "ARCHIVED", buildDiff(existing, updated));
    return updated;
  },
};
