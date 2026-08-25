import { Elysia } from 'elysia';
import { requireAuthPlugin } from '../../../core/auth';
import { templatesController } from './templates.controller';
import { createFromCategoryBody, applyTemplateBody, templateIdParams, categoryIdParams } from './templates.validator';

export const menuTemplatesRouter = new Elysia({ prefix: '/api/menu/templates' })
  .use(requireAuthPlugin())
  .get('/', ({ auth }) => templatesController.list(auth))
  .get('/:id', ({ auth, params }) => templatesController.get(auth, params.id), { params: templateIdParams })
  .post(
    '/from-category/:categoryId',
    ({ auth, params, body, set }) => {
      set.status = 201;
      return templatesController.createFromCategory(auth, params.categoryId, body.name, body.description);
    },
    { params: categoryIdParams, body: createFromCategoryBody },
  )
  .post(
    '/:id/apply',
    ({ auth, params, body, set }) => {
      set.status = 201;
      return templatesController.apply(auth, params.id, body ?? {});
    },
    { params: templateIdParams, body: applyTemplateBody },
  )
  .delete('/:id', ({ auth, params }) => templatesController.delete(auth, params.id), { params: templateIdParams });
