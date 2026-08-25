import { Elysia } from 'elysia';
import { requireAuthPlugin } from '../../../core/auth';
import { itemController } from './item.controller';
import {
  createItemBody,
  updateItemBody,
  duplicateItemBody,
  updateItemStatusBody,
  updateItemAvailabilityBody,
  itemIdParams,
  itemStatusParams,
  itemStatusQuery,
} from './item.validator';

export const menuItemsRouter = new Elysia({ prefix: '/api/menu/items' })
  .use(requireAuthPlugin())
  .post(
    '/',
    ({ auth, body, set }) => {
      set.status = 201;
      return itemController.create(auth, body);
    },
    { body: createItemBody },
  )
  // Static segment ("/status/:status") is matched before the "/:id"
  // wildcard by Elysia's router regardless of declaration order (they
  // have different segment counts), but declaring it first keeps the
  // route list readable top-to-bottom the way a client would hit them.
  .get(
    '/status/:status',
    ({ auth, params, query }) => itemController.listByStatus(auth, params.status, query.categoryId),
    { params: itemStatusParams, query: itemStatusQuery },
  )
  .get('/:id', ({ auth, params }) => itemController.getById(auth, params.id), {
    params: itemIdParams,
  })
  .patch(
    '/:id',
    ({ auth, params, body }) => itemController.update(auth, params.id, body),
    { params: itemIdParams, body: updateItemBody },
  )
  .delete('/:id', ({ auth, params }) => itemController.remove(auth, params.id), {
    params: itemIdParams,
  })
  .post(
    '/:id/duplicate',
    ({ auth, params, body, set }) => {
      set.status = 201;
      return itemController.duplicate(auth, params.id, body ?? {});
    },
    { params: itemIdParams, body: duplicateItemBody },
  )
  // Manager/owner-only — a waiter or cashier flipping an item live/draft
  // via a direct API call would bypass the whole point of the workflow.
  .patch('/:id/publish', ({ auth, params }) => itemController.publish(auth, params.id), {
    params: itemIdParams,
  })
  .patch('/:id/unpublish', ({ auth, params }) => itemController.unpublish(auth, params.id), {
    params: itemIdParams,
  })
  .put(
    '/:id/status',
    ({ auth, params, body }) => itemController.updateStatus(auth, params.id, body.status, body.reason),
    { params: itemIdParams, body: updateItemStatusBody },
  )
  .patch(
    '/:id/availability',
    ({ auth, params, body }) =>
      itemController.updateAvailability(auth, params.id, body.isAvailable, body.reason),
    { params: itemIdParams, body: updateItemAvailabilityBody },
  );
