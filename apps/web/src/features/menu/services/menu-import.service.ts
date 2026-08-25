import { apiClient } from '../../../shared/lib/api-client';

export interface RowError {
  row: number;
  field?: string;
  message: string;
}

export interface ValidatedRow {
  row: number;
  action: 'insert' | 'update';
  data: { name: string; categoryId: string; basePrice: string; sku: string | null; status: string };
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
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const menuImportService = {
  async downloadTemplate(format: 'csv' | 'xlsx'): Promise<void> {
    const res = await apiClient.get('/menu/import/items/template', { params: { format }, responseType: 'blob' });
    triggerDownload(res.data as Blob, `menu-items-template.${format}`);
  },

  async validate(file: File): Promise<ValidateImportResponse> {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post('/menu/import/items/validate', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  async commit(file: File): Promise<CommitImportResponse> {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post('/menu/import/items/commit', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
};
