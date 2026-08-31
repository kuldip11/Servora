import { Elysia } from "elysia";
import { requireAuthPlugin } from "../../../core/auth";
import { promotionController } from "./promotion.controller";
import { createPromotionBody, promotionParams, promotionPreviewBody, updatePromotionBody } from "./promotion.validator";
export const promotionsRouter = new Elysia({ prefix: "/api/menu/promotions" })
  .use(requireAuthPlugin())
  .get("/", ({ auth }) => promotionController.list(auth))
  .post("/preview", ({ auth, body }) => promotionController.preview(auth, body), { body: promotionPreviewBody })
  .post("/", ({ auth, body }) => promotionController.create(auth, body), { body: createPromotionBody })
  .patch("/:id", ({ auth, params, body }) => promotionController.update(auth, params.id, body), { params: promotionParams, body: updatePromotionBody })
  .delete("/:id", ({ auth, params }) => promotionController.remove(auth, params.id), { params: promotionParams })
  .get("/:id/stats", ({ auth, params }) => promotionController.stats(auth, params.id), { params: promotionParams });
