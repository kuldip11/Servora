import { Elysia } from "elysia";
import { requireAuthPlugin } from "@/core/auth";
import { itemController } from "./item.controller";
import {
  createItemBody,
  updateItemBody,
  duplicateItemBody,
  updateItemStatusBody,
  updateItemAvailabilityBody,
  itemIdParams,
  itemStatusParams,
  itemStatusQuery,
} from "./item.validator";

export const menuItemsRouter = new Elysia({ prefix: "/api/menu/items" })
  .use(requireAuthPlugin())
  .post(
    "/",
    ({ auth, body, set }) => {
      set.status = 201;
      return itemController.create(auth, body);
    },
    { body: createItemBody },
  )

  .get(
    "/status/:status",
    ({ auth, params, query }) =>
      itemController.listByStatus(auth, params.status, query.categoryId),
    { params: itemStatusParams, query: itemStatusQuery },
  )
  .get("/:id", ({ auth, params }) => itemController.getById(auth, params.id), {
    params: itemIdParams,
  })
  .patch(
    "/:id",
    ({ auth, params, body }) => itemController.update(auth, params.id, body),
    { params: itemIdParams, body: updateItemBody },
  )
  .delete(
    "/:id",
    ({ auth, params }) => itemController.remove(auth, params.id),
    {
      params: itemIdParams,
    },
  )
  .post(
    "/:id/duplicate",
    ({ auth, params, body, set }) => {
      set.status = 201;
      return itemController.duplicate(auth, params.id, body ?? {});
    },
    { params: itemIdParams, body: duplicateItemBody },
  )

  .patch(
    "/:id/publish",
    ({ auth, params }) => itemController.publish(auth, params.id),
    {
      params: itemIdParams,
    },
  )
  .patch(
    "/:id/unpublish",
    ({ auth, params }) => itemController.unpublish(auth, params.id),
    {
      params: itemIdParams,
    },
  )
  .put(
    "/:id/status",
    ({ auth, params, body }) =>
      itemController.updateStatus(auth, params.id, body.status, body.reason),
    { params: itemIdParams, body: updateItemStatusBody },
  )
  .patch(
    "/:id/availability",
    ({ auth, params, body }) =>
      itemController.updateAvailability(
        auth,
        params.id,
        body.isAvailable,
        body.reason,
      ),
    { params: itemIdParams, body: updateItemAvailabilityBody },
  );
