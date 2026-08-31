import { Elysia } from "elysia";
import { requireAuthPlugin } from "../../../core/auth";
import { successResponse, createdResponse } from "../../../core/response";
import { subRecipeService } from "./sub-recipe.service";
import { subRecipeBody, subRecipeParams } from "./sub-recipe.validator";

export const subRecipesRouter = new Elysia({ prefix: "/api/menu/sub-recipes" })
  .use(requireAuthPlugin())
  .get("/", async ({ auth }) => successResponse(await subRecipeService.list(auth)))
  .post("/", async ({ auth, body }) => createdResponse(await subRecipeService.create(auth, body)), { body: subRecipeBody })
  .put("/:id", async ({ auth, params, body }) => successResponse(await subRecipeService.update(auth, params.id, body)), { params: subRecipeParams, body: subRecipeBody })
  .delete("/:id", async ({ auth, params }) => { await subRecipeService.delete(auth, params.id); return successResponse({ deleted: true }); }, { params: subRecipeParams });
