import { apiClient } from "../../../shared/lib/api-client";

export type MenuExportEntity = "items" | "categories" | "recipes" | "modifiers";
export type MenuExportFormat = "csv" | "xlsx";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const menuExportService = {
  async download(
    entity: MenuExportEntity,
    format: MenuExportFormat,
  ): Promise<void> {
    const res = await apiClient.get(`/menu/export/${entity}`, {
      params: { format },
      responseType: "blob",
    });
    triggerDownload(res.data as Blob, `menu-${entity}.${format}`);
  },
};
