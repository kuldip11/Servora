/**
 * Modifier-groups/tags/allergens service — orchestrates
 * `modifier.repository.ts` and applies the input-shaping rules that used
 * to live inline in the controller: branch resolution on create, splitting
 * the "group fields" from the "options" sub-array on update, and the
 * additionalPrice number->string conversion Drizzle's numeric column needs.
 */
import type { AuthContext } from "../../../core/auth";
import { modifierRepository } from "./modifier.repository";
import { requirePermission } from "../../../core/auth";
import {
  assertMenuResourceBranch,
  resolveMenuBranch,
} from "../menu-authorization";
import {
  modifierGroupNotFound,
  modifierOptionNotFound,
} from "./modifier.errors";

type SelectionType = "SINGLE" | "MULTIPLE";

export interface ModifierOptionInput {
  name: string;
  additionalPrice: number;
  isAvailable?: boolean | undefined;
  maxQuantity?: number | undefined;
}

export interface CreateModifierGroupInput {
  name: string;
  selectionType?: SelectionType | undefined;
  minSelections?: number | undefined;
  maxSelections?: number | undefined;
  branchId?: string | undefined;
  options?: ModifierOptionInput[] | undefined;
}

export interface UpdateModifierGroupInput {
  name?: string | undefined;
  selectionType?: SelectionType | undefined;
  minSelections?: number | undefined;
  maxSelections?: number | null | undefined;
  options?: ModifierOptionInput[] | undefined;
}

export interface CreateTagInput {
  name: string;
  color?: string | undefined;
}

// Converts the wire-shape `additionalPrice: number` into the string
// Drizzle's `numeric` column type expects — same conversion the legacy
// controller did inline at both the create and update/options call sites.
function withStringPrice<T extends { additionalPrice: number }>(
  option: T,
): Omit<T, "additionalPrice"> & { additionalPrice: string } {
  return { ...option, additionalPrice: String(option.additionalPrice) };
}

export const modifierService = {
  // ─── Modifier Groups ───────────────────────────────────────────────────────

  async listGroups(auth: AuthContext) {
    requirePermission(auth, "menu:read");
    resolveMenuBranch(auth);
    return modifierRepository.findModifierGroups(
      auth.tenantId,
      auth.branchId ?? undefined,
    );
  },

  // No explicit branchId in the input -> falls back to whatever branch
  // context the request was made in, same fallback as categories/items.
  async createGroup(auth: AuthContext, input: CreateModifierGroupInput) {
    requirePermission(auth, "menu:create");
    const branchId = resolveMenuBranch(auth, input.branchId);
    return modifierRepository.createModifierGroup({
      ...input,
      tenantId: auth.tenantId,
      branchId,
      options: input.options?.map(withStringPrice),
    });
  },

  async updateGroup(
    auth: AuthContext,
    groupId: string,
    input: UpdateModifierGroupInput,
  ) {
    requirePermission(auth, "menu:update");
    const existing = await modifierRepository.findModifierGroup(
      auth.tenantId,
      groupId,
    );
    if (!existing) throw modifierGroupNotFound(groupId);
    assertMenuResourceBranch(auth, existing.branchId);
    const { options, ...groupFields } = input;
    const group = await modifierRepository.updateModifierGroup(
      auth.tenantId,
      groupId,
      groupFields,
    );
    if (!group) throw modifierGroupNotFound(groupId);

    if (options !== undefined) {
      await modifierRepository.setModifierGroupOptions(
        groupId,
        options.map(withStringPrice),
      );
    }

    return group;
  },

  // Preserves the legacy behavior of not raising a not-found error on
  // delete of a group that's already gone — same as the original
  // `deleteModifierGroup` route, which never checked the affected row count.
  async deleteGroup(auth: AuthContext, groupId: string) {
    requirePermission(auth, "menu:delete");
    const existing = await modifierRepository.findModifierGroup(
      auth.tenantId,
      groupId,
    );
    if (!existing) return;
    assertMenuResourceBranch(auth, existing.branchId);
    await modifierRepository.deleteModifierGroup(auth.tenantId, groupId);
  },

  async setOptionAvailability(
    auth: AuthContext,
    optionId: string,
    isAvailable: boolean,
  ) {
    requirePermission(auth, "menu:update");
    const existing = await modifierRepository.findModifierOption(
      auth.tenantId,
      optionId,
    );
    if (!existing) throw modifierOptionNotFound(optionId);
    assertMenuResourceBranch(auth, existing.branchId);
    const updated = await modifierRepository.setOptionAvailability(
      auth.tenantId,
      optionId,
      isAvailable,
    );
    if (!updated) throw modifierOptionNotFound(optionId);
    return updated;
  },

  // ─── Tags ──────────────────────────────────────────────────────────────────

  async listTags(auth: AuthContext) {
    requirePermission(auth, "menu:read");
    return modifierRepository.findTags(auth.tenantId);
  },

  async createTag(auth: AuthContext, input: CreateTagInput) {
    requirePermission(auth, "menu:create");
    return modifierRepository.createTag(auth.tenantId, input.name, input.color);
  },

  // Same as deleteGroup — no not-found check, matching the legacy route.
  async deleteTag(auth: AuthContext, tagId: string) {
    requirePermission(auth, "menu:delete");
    await modifierRepository.deleteTag(auth.tenantId, tagId);
  },

  // ─── Allergens (fixed, seeded list — no tenant scoping) ────────────────────

  async listAllergens() {
    return modifierRepository.findAllergens();
  },
};
