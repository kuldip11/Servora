import { Elysia } from "elysia";
import { requireAuthPlugin } from "../../core/auth";
import { inventoryController } from "./inventory.controller";
import {
  createInventoryItemBody,
  updateStockBody,
  inventoryItemIdParams,
} from "./inventory.validator";

export const inventoryRouter = new Elysia()
  // Branch-locked staff see only their own branch's stock. Owner/manager can
  // switch branches (or view "all") from the server-issued active context — handled by
  // requireAuthPlugin resolving auth.branchId to null for "all".
  .use(requireAuthPlugin())
  // "All Branches" returns every branch's stock, each item tagged with its
  // own branch — not summed together (see inventoryRepository.findAllBranches
  // for why).
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
  );
