import { Elysia } from "elysia";
import { requireAuthPlugin } from "../../core/auth";
import { createdResponse, successResponse } from "../../core/response";
import { customerGroupService } from "./customer-group.service";
import { createCustomerGroupBody, customerGroupIdParams, updateCustomerGroupBody } from "./customer-group.validator";
export const customerGroupsRouter = new Elysia({ prefix: "/api/customer-groups" })
  .use(requireAuthPlugin())
  .get("/", ({ auth }) => customerGroupService.list(auth).then(successResponse))
  .get("/:id", ({ auth, params }) => customerGroupService.findById(auth, params.id).then(successResponse), { params: customerGroupIdParams })
  .post("/", ({ auth, body }) => customerGroupService.create(auth, body).then(createdResponse), { body: createCustomerGroupBody })
  .patch("/:id", ({ auth, params, body }) => customerGroupService.update(auth, params.id, body).then(successResponse), { params: customerGroupIdParams, body: updateCustomerGroupBody })
  .delete("/:id", async ({ auth, params }) => { await customerGroupService.remove(auth, params.id); return successResponse(null); }, { params: customerGroupIdParams });
