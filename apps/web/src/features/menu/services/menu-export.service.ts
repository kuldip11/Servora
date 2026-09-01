import { createMenuApi } from "@pos/api-client";
import { apiClient } from "@/shared/lib/api-client";

const menuApi = createMenuApi(apiClient);

export type MenuExportEntity = "items" | "categories" | "recipes" | "modifiers";
export type MenuExportFormat = "csv" | "xlsx";

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const menuExportService = {
  async download(
    entity: MenuExportEntity,
    format: MenuExportFormat,
  ): Promise<void> {
    const blob = await menuApi.exportEntity(entity, format);
    triggerDownload(blob, `menu-${entity}.${format}`);
  },
};
