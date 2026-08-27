import { Elysia } from "elysia";
import { requireAuthPlugin } from "../../core/auth";
import { permissionController } from "./permission.controller";
import {
  rolePermissionParams,
  setRolePermissionsBody,
} from "./permission.validator";

export const permissionsRouter = new Elysia()
  .use(requireAuthPlugin())
  .get("/api/permissions/", ({ auth }) => permissionController.list(auth))
  .get(
    "/api/roles/:id/permissions",
    ({ auth, params }) => permissionController.forRole(auth, params.id),
    { params: rolePermissionParams },
  )
  .put(
    "/api/roles/:id/permissions",
    ({ auth, params, body }) =>
      permissionController.setForRole(auth, params.id, body.permissionIds),
    { params: rolePermissionParams, body: setRolePermissionsBody },
  );
