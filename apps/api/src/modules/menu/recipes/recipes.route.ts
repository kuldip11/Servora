import { Elysia } from "elysia";
import { requireAuthPlugin } from "@/core/auth";
import { recipesController } from "./recipes.controller";
import { setRecipeBody, itemIdParams } from "./recipes.validator";

export const menuRecipesRouter = new Elysia({ prefix: "/api/menu" })
  .use(requireAuthPlugin())
  .get(
    "/items/:id/recipes",
    ({ auth, params }) => recipesController.getItemRecipe(auth, params.id),
    { params: itemIdParams },
  )
  .post(
    "/items/:id/recipes",
    ({ auth, params, body }) =>
      recipesController.setItemRecipe(auth, params.id, body.ingredients),
    { params: itemIdParams, body: setRecipeBody },
  );
