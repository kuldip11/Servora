import { createMenuApi } from "@pos/api-client";
import { apiClient } from "@/shared/lib/api-client";

const menuApi = createMenuApi(apiClient);

export const menuTagsService = {
  list: menuApi.listTags,
  create: menuApi.createTag,
  remove: menuApi.removeTag,
};
