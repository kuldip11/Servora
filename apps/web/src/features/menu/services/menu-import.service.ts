import { createMenuApi } from "@pos/api-client";
import { apiClient } from "../../../shared/lib/api-client";

const menuApi = createMenuApi(apiClient);

export interface RowError {
  row: number;
  field?: string;
  message: string;
}

export interface ValidatedRow {
  row: number;
  action: "insert" | "update";
  data: {
    name: string;
    categoryId: string;
    basePrice: string;
    sku: string | null;
    status: string;
  };
}

export interface ValidateImportResponse {
  totalRows: number;
  validCount: number;
  preview: ValidatedRow[];
  errors: RowError[];
}

export interface CommitImportResponse {
  inserted: number;
  updated: number;
}

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

export const menuImportService = {
  async downloadTemplate(format: "csv" | "xlsx"): Promise<void> {
    const blob = await menuApi.downloadImportTemplate(format);
    triggerDownload(blob, `menu-items-template.${format}`);
  },

  async validate(file: File): Promise<ValidateImportResponse> {
    const form = new FormData();
    form.append("file", file);
    return menuApi.validateImport<ValidateImportResponse>(form);
  },

  async commit(file: File): Promise<CommitImportResponse> {
    const form = new FormData();
    form.append("file", file);
    return menuApi.commitImport<CommitImportResponse>(form);
  },
};
