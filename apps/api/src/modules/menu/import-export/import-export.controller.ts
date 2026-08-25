/**
 * Menu import/export controller — thin handlers only. Auth/branch
 * resolution comes from `requireAuthPlugin` (applied in
 * `import-export.route.ts`); business logic lives in
 * `import-export.service.ts`.
 *
 * Export/template endpoints return the file directly (a raw `Response`,
 * not the `{ success, data }` envelope every other route uses) since
 * these are downloads, not JSON API responses — same as the pre-refactor
 * controller.
 */
import type { AuthContext } from '../../../core/auth';
import { successResponse } from '../../../core/response';
import { importExportService, type ExportFormat } from './import-export.service';
import { emptyImportFile } from './import-export.errors';

function fileResponse(file: { content: string | Buffer; contentType: string }, filename: string): Response {
  return new Response(file.content, {
    headers: { 'Content-Type': file.contentType, 'Content-Disposition': `attachment; filename="${filename}"` },
  });
}

export const importExportController = {
  // ─── Export ──────────────────────────────────────────────────────────
  async exportItems(auth: AuthContext, format: ExportFormat, branchId: string | undefined) {
    const file = await importExportService.exportItems(auth, format, branchId);
    return fileResponse(file, `menu-items.${format}`);
  },

  async exportCategories(auth: AuthContext, format: ExportFormat) {
    const file = await importExportService.exportCategories(auth, format);
    return fileResponse(file, `menu-categories.${format}`);
  },

  async exportRecipes(auth: AuthContext, format: ExportFormat) {
    const file = await importExportService.exportRecipes(auth, format);
    return fileResponse(file, `menu-recipes.${format}`);
  },

  async exportModifiers(auth: AuthContext, format: ExportFormat) {
    const file = await importExportService.exportModifiers(auth, format);
    return fileResponse(file, `menu-modifiers.${format}`);
  },

  // ─── Import ──────────────────────────────────────────────────────────
  importTemplate(format: 'csv' | 'xlsx') {
    const file = importExportService.buildTemplate(format);
    return fileResponse(file, `menu-items-template.${format}`);
  },

  async validateImport(auth: AuthContext, file: File | undefined) {
    importExportService.requireFile(file);
    const rows = await importExportService.parseUpload(file!);
    if (!rows.length) throw emptyImportFile();
    const { valid, errors } = await importExportService.validateItemsImport(auth, rows);
    return successResponse({ totalRows: rows.length, validCount: valid.length, preview: valid, errors });
  },

  async commitImport(auth: AuthContext, file: File | undefined) {
    importExportService.requireFile(file);
    const rows = await importExportService.parseUpload(file!);
    const result = await importExportService.commitItemsImport(auth, rows);
    return successResponse(result);
  },
};
