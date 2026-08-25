import { Elysia } from 'elysia';
import { requireAuthPlugin } from '../../core/auth';
import { analyticsController } from './analytics.controller';

export const analyticsRouter = new Elysia()
  // undefined/null branchId = aggregate across all branches (owner/manager
  // "All Branches" view) — resolved by requireAuthPlugin from X-Branch-Id.
  .use(requireAuthPlugin())
  .get('/api/analytics/dashboard', ({ auth }) => analyticsController.getDashboard(auth));
