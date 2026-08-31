import { Elysia } from "elysia";
import { requireAuthPlugin } from "@/core/auth";
import { organizationController } from "./organization.controller";
import {
  createOrganizationBody,
  updateOrganizationBody,
  organizationIdParams,
  organizationMenuParams,
  organizationLoyaltyTierParams,
  createOrganizationMenuBody,
  updateOrganizationMenuBody,
} from "./organization.validator";
import {
  loyaltyTierBody,
  updateLoyaltyTierBody,
} from "@/modules/loyalty/loyalty.validator";

export const organizationsRouter = new Elysia({ prefix: "/api/organizations" })
  .use(requireAuthPlugin())
  .get("/", ({ auth }) => organizationController.list(auth))
  .post(
    "/",
    ({ auth, body, set }) => {
      set.status = 201;
      return organizationController.create(auth, body);
    },
    { body: createOrganizationBody },
  )
  .get(
    "/:id/tenants",
    ({ auth, params }) => organizationController.listTenants(auth, params.id),
    { params: organizationIdParams },
  )
  .get(
    "/:id/loyalty-tiers",
    ({ auth, params }) =>
      organizationController.listLoyaltyTiers(auth, params.id),
    { params: organizationIdParams },
  )
  .post(
    "/:id/loyalty-tiers",
    ({ auth, params, body }) =>
      organizationController.createLoyaltyTier(auth, params.id, body),
    { params: organizationIdParams, body: loyaltyTierBody },
  )
  .patch(
    "/:id/loyalty-tiers/:tierId",
    ({ auth, params, body }) =>
      organizationController.updateLoyaltyTier(
        auth,
        params.id,
        params.tierId,
        body,
      ),
    { params: organizationLoyaltyTierParams, body: updateLoyaltyTierBody },
  )
  .delete(
    "/:id/loyalty-tiers/:tierId",
    ({ auth, params }) =>
      organizationController.deleteLoyaltyTier(auth, params.id, params.tierId),
    { params: organizationLoyaltyTierParams },
  )
  .get(
    "/:id/menus",
    ({ auth, params }) => organizationController.listMenus(auth, params.id),
    { params: organizationIdParams },
  )
  .post(
    "/:id/menus",
    ({ auth, params, body }) =>
      organizationController.createMenu(auth, params.id, body),
    { params: organizationIdParams, body: createOrganizationMenuBody },
  )
  .patch(
    "/:id/menus/:menuId",
    ({ auth, params, body }) =>
      organizationController.updateMenu(auth, params.id, params.menuId, body),
    { params: organizationMenuParams, body: updateOrganizationMenuBody },
  )
  .delete(
    "/:id/menus/:menuId",
    ({ auth, params }) =>
      organizationController.deleteMenu(auth, params.id, params.menuId),
    { params: organizationMenuParams },
  )
  .patch(
    "/:id",
    ({ auth, params, body }) =>
      organizationController.update(auth, params.id, body),
    {
      params: organizationIdParams,
      body: updateOrganizationBody,
    },
  )
  .delete(
    "/:id",
    ({ auth, params }) => organizationController.archive(auth, params.id),
    {
      params: organizationIdParams,
    },
  );
