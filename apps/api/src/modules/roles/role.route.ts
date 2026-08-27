import { Elysia } from "elysia";
import { requireAuthPlugin } from "../../core/auth";
import { roleController } from "./role.controller";
import { createRoleBody, roleIdParams, updateRoleBody } from "./role.validator";

export const rolesRouter = new Elysia()
  .use(requireAuthPlugin())
  .get("/api/roles/", ({ auth }) => roleController.list(auth))
  .post("/api/roles/", ({ auth, body, set }) => { set.status = 201; return roleController.create(auth, body); }, { body: createRoleBody })
  .patch("/api/roles/:id", ({ auth, params, body }) => roleController.update(auth, params.id, body), { params: roleIdParams, body: updateRoleBody })
  .delete("/api/roles/:id", ({ auth, params }) => roleController.archive(auth, params.id), { params: roleIdParams });
