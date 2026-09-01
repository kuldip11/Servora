import { Elysia } from "elysia";
import { requireAuthPlugin } from "@/core/auth";
import { inventoryController } from "./inventory.controller";
import {
  createInventoryItemBody,
  updateStockBody,
  inventoryItemIdParams,
  logWasteBody,
  createWasteReasonBody,
  updateWasteReasonBody,
} from "./inventory.validator";

export const inventoryRouter = new Elysia()

  .use(requireAuthPlugin())

  .get("/api/inventory/items", ({ auth }) => inventoryController.list(auth))
  .post(
    "/api/inventory/items",
    ({ auth, body, set }) => {
      set.status = 201;
      return inventoryController.create(auth, body);
    },
    { body: createInventoryItemBody },
  )
  .patch(
    "/api/inventory/items/:id/stock",
    ({ auth, params, body }) =>
      inventoryController.updateStock(auth, params.id, body),
    { params: inventoryItemIdParams, body: updateStockBody },
  )
  .get("/api/inventory/alerts/low-stock", ({ auth }) =>
    inventoryController.lowStockAlerts(auth),
  )
  .get("/api/inventory/transactions", ({ auth }) =>
    inventoryController.recentTransactions(auth),
  )
  .get(
    "/api/inventory/items/:id/recipe-impact",
    ({ auth, params }) => inventoryController.recipeImpact(auth, params.id),
    { params: inventoryItemIdParams },
  )
  .get("/api/inventory/waste-reasons", ({ auth, query }) =>
    inventoryController.listWasteReasons(
      auth,
      query.includeInactive === "true",
    ),
  )
  .post(
    "/api/inventory/waste-reasons",
    ({ auth, body, set }) => {
      set.status = 201;
      return inventoryController.createWasteReason(auth, body);
    },
    { body: createWasteReasonBody },
  )
  .patch(
    "/api/inventory/waste-reasons/:id",
    ({ auth, params, body }) =>
      inventoryController.updateWasteReason(auth, params.id, body),
    { params: inventoryItemIdParams, body: updateWasteReasonBody },
  )
  .post(
    "/api/inventory/items/:id/waste",
    ({ auth, params, body }) =>
      inventoryController.logWaste(auth, params.id, body),
    { params: inventoryItemIdParams, body: logWasteBody },
  );
