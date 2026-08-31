import { Elysia } from "elysia";
import { requireAuthPlugin } from "../../../core/auth";
import { createdResponse, successResponse } from "../../../core/response";
import { membershipService } from "./membership.service";
import { itemMembershipParams, membershipBody, membershipParams, menuItemsParams } from "./membership.validator";

export const menuMembershipsRouter = new Elysia({ prefix: "/api/menu" })
  .use(requireAuthPlugin())
  .get("/items/:id/memberships", async ({ auth, params }) =>
    successResponse(await membershipService.listForItem(auth, params.id)), { params: itemMembershipParams })
  .post("/items/:id/memberships", async ({ auth, params, body }) =>
    createdResponse(await membershipService.assign(auth, params.id, body)), { params: itemMembershipParams, body: membershipBody })
  .delete("/items/:id/memberships/:menuId", async ({ auth, params }) => {
    await membershipService.remove(auth, params.id, params.menuId);
    return successResponse(null);
  }, { params: membershipParams })
  .get("/menus/:id/items", async ({ auth, params }) =>
    successResponse(await membershipService.listItems(auth, params.id)), { params: menuItemsParams });
