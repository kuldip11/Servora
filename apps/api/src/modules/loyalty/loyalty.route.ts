import { Elysia } from "elysia";
import { requireAuthPlugin } from "@/core/auth";
import { successResponse, createdResponse } from "@/core/response";
import { loyaltyService } from "./loyalty.service";
import {
  customerBody,
  idParams,
  loyaltyTierBody,
  updateCustomerBody,
  updateLoyaltyTierBody,
} from "./loyalty.validator";

export const loyaltyRouter = new Elysia({ prefix: "/api/loyalty" })
  .use(requireAuthPlugin())
  .get("/tiers", async ({ auth }) =>
    successResponse(await loyaltyService.listTiers(auth)),
  )
  .post(
    "/tiers",
    async ({ auth, body }) =>
      createdResponse(await loyaltyService.createTier(auth, body)),
    { body: loyaltyTierBody },
  )
  .patch(
    "/tiers/:id",
    async ({ auth, params, body }) =>
      successResponse(await loyaltyService.updateTier(auth, params.id, body)),
    { params: idParams, body: updateLoyaltyTierBody },
  )
  .delete(
    "/tiers/:id",
    async ({ auth, params }) => {
      await loyaltyService.removeTier(auth, params.id);
      return successResponse(null);
    },
    { params: idParams },
  )
  .get("/customers", async ({ auth }) =>
    successResponse(await loyaltyService.listCustomers(auth)),
  )
  .post(
    "/customers",
    async ({ auth, body }) =>
      createdResponse(await loyaltyService.createCustomer(auth, body)),
    { body: customerBody },
  )
  .patch(
    "/customers/:id",
    async ({ auth, params, body }) =>
      successResponse(
        await loyaltyService.updateCustomer(auth, params.id, body),
      ),
    { params: idParams, body: updateCustomerBody },
  );
