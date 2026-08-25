import { Elysia } from "elysia";
import { requireAuthPlugin } from "../../../core/auth";
import { bulkOpsController } from "./bulk-ops.controller";
import {
  bulkStatusBody,
  bulkCategoryBody,
  bulkTagsBody,
  bulkModifiersBody,
  bulkPriceBody,
  bulkDeleteBody,
} from "./bulk-ops.validator";

// Mounted at a clean, collision-free sub-path (`/items/bulk/...`) under the
// shared `/api/menu` prefix, alongside the legacy `menuRouter` and the other
// menu sub-routers — same approach as `items`/`categories`.
export const menuBulkOpsRouter = new Elysia({ prefix: "/api/menu/items/bulk" })
  .use(requireAuthPlugin())
  .post(
    "/status",
    ({ auth, body }) =>
      bulkOpsController.updateItemsStatus(
        auth,
        body.itemIds,
        body.status,
        body.reason,
      ),
    { body: bulkStatusBody },
  )
  .post(
    "/category",
    ({ auth, body }) =>
      bulkOpsController.updateItemsCategory(
        auth,
        body.itemIds,
        body.categoryId,
      ),
    { body: bulkCategoryBody },
  )
  .post(
    "/tags",
    ({ auth, body }) =>
      bulkOpsController.bulkSetItemTags(
        auth,
        body.itemIds,
        body.tagIds,
        body.mode,
      ),
    { body: bulkTagsBody },
  )
  .post(
    "/modifiers",
    ({ auth, body }) =>
      bulkOpsController.bulkSetItemModifierGroups(
        auth,
        body.itemIds,
        body.modifierGroupIds,
        body.mode,
      ),
    { body: bulkModifiersBody },
  )
  .post(
    "/price",
    ({ auth, body }) =>
      bulkOpsController.bulkUpdatePrice(
        auth,
        body.itemIds,
        body.priceChange,
        body.mode,
      ),
    { body: bulkPriceBody },
  )
  .post(
    "/delete",
    ({ auth, body }) => bulkOpsController.bulkDeleteItems(auth, body.itemIds),
    { body: bulkDeleteBody },
  );
