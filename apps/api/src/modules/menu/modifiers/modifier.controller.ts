

import type { AuthContext } from "../../../core/auth";
import { successResponse, createdResponse } from "../../../core/response";
import {
  modifierService,
  type CreateModifierGroupInput,
  type UpdateModifierGroupInput,
  type CreateTagInput,
} from "./modifier.service";

export const modifierController = {

  async listGroups(auth: AuthContext) {
    const groups = await modifierService.listGroups(auth);
    return successResponse(groups);
  },

  async createGroup(auth: AuthContext, input: CreateModifierGroupInput) {
    const group = await modifierService.createGroup(auth, input);
    return createdResponse(group);
  },

  async updateGroup(
    auth: AuthContext,
    groupId: string,
    input: UpdateModifierGroupInput,
  ) {
    const group = await modifierService.updateGroup(auth, groupId, input);
    return successResponse(group);
  },

  async deleteGroup(auth: AuthContext, groupId: string) {
    await modifierService.deleteGroup(auth, groupId);
    return successResponse(null);
  },

  async setOptionAvailability(
    auth: AuthContext,
    optionId: string,
    isAvailable: boolean,
  ) {
    const option = await modifierService.setOptionAvailability(
      auth,
      optionId,
      isAvailable,
    );
    return successResponse(option);
  },

  async listTags(auth: AuthContext) {
    const tags = await modifierService.listTags(auth);
    return successResponse(tags);
  },

  async createTag(auth: AuthContext, input: CreateTagInput) {
    const tag = await modifierService.createTag(auth, input);
    return createdResponse(tag);
  },

  async deleteTag(auth: AuthContext, tagId: string) {
    await modifierService.deleteTag(auth, tagId);
    return successResponse(null);
  },

  async listAllergens(_auth: AuthContext) {
    const allergens = await modifierService.listAllergens();
    return successResponse(allergens);
  },
};
