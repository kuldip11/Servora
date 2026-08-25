import { Elysia } from 'elysia';
import { requireAuthPlugin } from '../../../core/auth';
import { recipesController } from './recipes.controller';
import {
  setRecipeBody,
  upsertRecipeIngredientBody,
  itemIdParams,
  itemInventoryParams,
} from './recipes.validator';

// Mounted at the shared `/api/menu` base prefix (this sub-domain's routes
// live under `/items/:id/recipes...` and `/items/:id/can-order`, not a
// clean sub-path the way `bulk-ops` was) — alongside the legacy
// `menuRouter` and the other menu sub-routers. No path collisions
// (verified — the legacy router no longer has these routes after this
// migration; see docs/NEXT_STEPS.md).
export const menuRecipesRouter = new Elysia({ prefix: '/api/menu' })
  .use(requireAuthPlugin())
  .get(
    '/items/:id/recipes',
    ({ auth, params }) => recipesController.getItemRecipe(auth, params.id),
    { params: itemIdParams },
  )
  .post(
    '/items/:id/recipes',
    ({ auth, params, body }) => recipesController.setItemRecipe(auth, params.id, body.ingredients),
    { params: itemIdParams, body: setRecipeBody },
  )
  .put(
    '/items/:id/recipes/:inventoryItemId',
    ({ auth, params, body }) =>
      recipesController.upsertRecipeIngredient(
        auth, params.id, params.inventoryItemId, body.quantity, body.unit, body.isOptional ?? false,
      ),
    { params: itemInventoryParams, body: upsertRecipeIngredientBody },
  )
  .delete(
    '/items/:id/recipes/:inventoryItemId',
    ({ auth, params }) => recipesController.deleteRecipeIngredient(auth, params.id, params.inventoryItemId),
    { params: itemInventoryParams },
  )
  .get(
    '/items/:id/can-order',
    ({ auth, params }) => recipesController.checkCanOrder(auth, params.id),
    { params: itemIdParams },
  );
