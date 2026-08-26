import { Elysia } from "elysia";
import { requireAuthPlugin } from "../../core/auth";
import { tenantController } from "./tenant.controller";
import {
  createTenantBody,
  updateTenantBody,
  tenantIdParams,
} from "./tenant.validator";

export const tenantsRouter = new Elysia({ prefix: "/api/tenants" })
  .use(requireAuthPlugin())
  .get("/", ({ auth }) => tenantController.list(auth))
  .post(
    "/",
    ({ auth, body, set }) => {
      set.status = 201;
      return tenantController.create(auth, body);
    },
    { body: createTenantBody },
  )
  .patch(
    "/:id",
    ({ auth, params, body }) => tenantController.update(auth, params.id, body),
    {
      params: tenantIdParams,
      body: updateTenantBody,
    },
  )
  .delete(
    "/:id",
    ({ auth, params }) => tenantController.archive(auth, params.id),
    {
      params: tenantIdParams,
    },
  );
