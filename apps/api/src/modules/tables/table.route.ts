import { Elysia } from "elysia";
import { requireAuthPlugin } from "../../core/auth";
import { tableController } from "./table.controller";
import {
  createTableBody,
  updateTableBody,
  updateTableStatusBody,
  tableIdParams,
} from "./table.validator";

export const tablesRouter = new Elysia()

  .use(requireAuthPlugin())
  .get("/api/tables/", ({ auth }) => tableController.list(auth))
  .post(
    "/api/tables/",
    ({ auth, body, set }) => {
      set.status = 201;
      return tableController.create(auth, body);
    },
    { body: createTableBody },
  )
  .post(
    "/api/tables/:id/qr/regenerate",
    ({ auth, params }) => tableController.regenerateQr(auth, params.id),
    { params: tableIdParams },
  )
  .patch(
    "/api/tables/:id/status",
    ({ auth, params, body }) =>
      tableController.updateStatus(auth, params.id, body.status),
    { params: tableIdParams, body: updateTableStatusBody },
  )
  .patch(
    "/api/tables/:id",
    ({ auth, params, body }) => tableController.update(auth, params.id, body),
    { params: tableIdParams, body: updateTableBody },
  )
  .delete(
    "/api/tables/:id",
    ({ auth, params }) => tableController.remove(auth, params.id),
    {
      params: tableIdParams,
    },
  );
