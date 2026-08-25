import { Elysia } from 'elysia';
import { requireAuthPlugin } from '../../core/auth';
import { tableController } from './table.controller';
import {
  createTableBody,
  updateTableBody,
  updateTableStatusBody,
  tableIdParams,
} from './table.validator';

export const tablesRouter = new Elysia()
  // Branch-locked staff see only their own branch's tables. Owner/manager can
  // switch branches (or view "all") from the server-issued active context — handled by
  // requireAuthPlugin resolving auth.branchId to null for "all".
  .use(requireAuthPlugin())
  .get('/api/tables/', ({ auth }) => tableController.list(auth))
  .post(
    '/api/tables/',
    ({ auth, body, set }) => {
      set.status = 201;
      return tableController.create(auth, body);
    },
    { body: createTableBody },
  )
  .patch(
    '/api/tables/:id/status',
    ({ auth, params, body }) => tableController.updateStatus(auth, params.id, body.status),
    { params: tableIdParams, body: updateTableStatusBody },
  )
  .patch(
    '/api/tables/:id',
    ({ auth, params, body }) => tableController.update(auth, params.id, body),
    { params: tableIdParams, body: updateTableBody },
  )
  .delete('/api/tables/:id', ({ auth, params }) => tableController.remove(auth, params.id), {
    params: tableIdParams,
  });
