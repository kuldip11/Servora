import { Elysia } from "elysia";
import { requireAuthPlugin } from "../../core/auth";
import { organizationController } from "./organization.controller";
import { createOrganizationBody, updateOrganizationBody, organizationIdParams } from "./organization.validator";

export const organizationsRouter = new Elysia({ prefix: "/api/organizations" })
  .use(requireAuthPlugin())
  .get("/", ({ auth }) => organizationController.list(auth))
  .post("/", ({ auth, body, set }) => {
    set.status = 201;
    return organizationController.create(auth, body);
  }, { body: createOrganizationBody })
  .patch("/:id", ({ auth, params, body }) => organizationController.update(auth, params.id, body), {
    params: organizationIdParams,
    body: updateOrganizationBody,
  })
  .delete("/:id", ({ auth, params }) => organizationController.archive(auth, params.id), {
    params: organizationIdParams,
  });
