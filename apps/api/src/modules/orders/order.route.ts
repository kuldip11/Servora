import { Elysia } from "elysia";
import { requireAuthPlugin } from "../../core/auth";
import { orderController } from "./order.controller";
import {
  createOrderBody,
  updateOrderStatusBody,
  fireTicketBody,
  orderIdParams,
  orderListQuery,
} from "./order.validator";

export const ordersRouter = new Elysia()
  .use(requireAuthPlugin())
  .get("/api/orders/", ({ auth, query }) => orderController.list(auth, query), {
    query: orderListQuery,
  })
  .get(
    "/api/orders/:id",
    ({ auth, params }) => orderController.getById(auth, params.id),
    {
      params: orderIdParams,
    },
  )
  .get(
    "/api/orders/:id/inventory-impact",
    ({ auth, params }) => orderController.getInventoryImpact(auth, params.id),
    { params: orderIdParams },
  )
  .post(
    "/api/orders/",
    ({ auth, body, set }) => {
      set.status = 201;
      return orderController.create(auth, body);
    },
    { body: createOrderBody },
  )
  .patch(
    "/api/orders/:id/status",
    ({ auth, params, body }) =>
      orderController.updateStatus(auth, params.id, body.status, body.reason),
    { params: orderIdParams, body: updateOrderStatusBody },
  )
  // Fire a new round of items to the kitchen for an open tab.
  .post(
    "/api/orders/:id/items",
    ({ auth, params, body }) =>
      orderController.fireTicket(auth, params.id, body),
    { params: orderIdParams, body: fireTicketBody },
  );
