import { Elysia } from "elysia";
import { requireAuthPlugin } from "../../../core/auth";
import { importExportController } from "./import-export.controller";
import {
  exportItemsQuery,
  exportQuery,
  importFileBody,
} from "./import-export.validator";
import type { ExportFormat } from "./import-export.service";

function toFormat(raw: string | undefined): ExportFormat {
  return raw === "xlsx" ? "xlsx" : "csv";
}

// Import/export endpoints share the `/api/menu` namespace and delegate
// authorization and validation to the shared menu boundary.
export const menuImportExportRouter = new Elysia({ prefix: "/api/menu" })
  .use(requireAuthPlugin())
  // ─── Export ────────────────────────────────────────────────────────────
  .get(
    "/export/items",
    ({ auth, query }) =>
      importExportController.exportItems(
        auth,
        toFormat(query.format),
        query.branchId,
      ),
    { query: exportItemsQuery },
  )
  .get(
    "/export/categories",
    ({ auth, query }) =>
      importExportController.exportCategories(auth, toFormat(query.format)),
    { query: exportQuery },
  )
  .get(
    "/export/recipes",
    ({ auth, query }) =>
      importExportController.exportRecipes(auth, toFormat(query.format)),
    { query: exportQuery },
  )
  .get(
    "/export/modifiers",
    ({ auth, query }) =>
      importExportController.exportModifiers(auth, toFormat(query.format)),
    { query: exportQuery },
  )
  // ─── Import ────────────────────────────────────────────────────────────
  // Two-step (validate -> commit): /validate writes nothing; only /commit
  // does, and it re-validates first so nothing can slip an invalid row
  // through between the two calls.
  .get(
    "/import/items/template",
    ({ query }) =>
      importExportController.importTemplate(toFormat(query.format)),
    { query: exportQuery },
  )
  .post(
    "/import/items/validate",
    ({ auth, body }) => importExportController.validateImport(auth, body.file),
    { body: importFileBody },
  )
  .post(
    "/import/items/commit",
    ({ auth, body }) => importExportController.commitImport(auth, body.file),
    { body: importFileBody },
  );
