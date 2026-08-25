import { Elysia } from "elysia";
import { requireAuthPlugin } from "../../../core/auth";
import { categoryController } from "./category.controller";
import {
  createCategoryBody,
  updateCategoryBody,
  categoryIdParams,
} from "./category.validator";

export const menuCategoriesRouter = new Elysia({
  prefix: "/api/menu/categories",
})
  .use(requireAuthPlugin())
  .get("/", ({ auth }) => categoryController.list(auth))
  .post(
    "/",
    ({ auth, body, set }) => {
      set.status = 201;
      return categoryController.create(auth, body);
    },
    { body: createCategoryBody },
  )
  .patch(
    "/:id",
    ({ auth, params, body }) =>
      categoryController.update(auth, params.id, body),
    { params: categoryIdParams, body: updateCategoryBody },
  )
  // Deactivate rather than delete (see category.service.ts#deactivate).
  .delete(
    "/:id",
    ({ auth, params }) => categoryController.deactivate(auth, params.id),
    {
      params: categoryIdParams,
    },
  );
