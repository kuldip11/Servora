import { Elysia } from "elysia";
import { requireAuthPlugin } from "@/core/auth";
import { priceRuleController } from "./price-rule.controller";
import {
  createHappyHourBody,
  createPriceRuleBody,
  listPriceRulesQuery,
  priceRuleParams,
  updatePriceRuleBody,
} from "./price-rule.validator";

export const priceRulesRouter = new Elysia({ prefix: "/api/menu/price-rules" })
  .use(requireAuthPlugin())
  .get(
    "/",
    ({ auth, query }) =>
      priceRuleController.list(
        auth,
        query.menuItemId,
        query.organizationId,
        query.menuItemSku,
      ),
    {
      query: listPriceRulesQuery,
    },
  )
  .post("/", ({ auth, body }) => priceRuleController.create(auth, body), {
    body: createPriceRuleBody,
  })
  .post(
    "/happy-hour",
    ({ auth, body }) => priceRuleController.createHappyHour(auth, body),
    {
      body: createHappyHourBody,
    },
  )
  .patch(
    "/:id",
    ({ auth, params, body }) =>
      priceRuleController.update(auth, params.id, body),
    {
      params: priceRuleParams,
      body: updatePriceRuleBody,
    },
  )
  .delete(
    "/:id",
    ({ auth, params }) => priceRuleController.remove(auth, params.id),
    {
      params: priceRuleParams,
    },
  );
