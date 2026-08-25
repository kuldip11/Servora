import { Elysia } from 'elysia';
import type { AuthContext } from '../../core/auth';
import { requireMenuPermission, type MenuPermission } from './menu-authorization';

function permissionFor(pathname: string, method: string): MenuPermission {
  if (/\/publish$|\/unpublish$/.test(pathname)) return 'menu:publish';
  if (method === 'GET') return 'menu:read';
  if (method === 'POST') return 'menu:create';
  if (method === 'DELETE') return 'menu:delete';
  return 'menu:update';
}

/** Central API-boundary permission gate for all menu endpoints. */
export const menuAuthorizationPlugin = () =>
  new Elysia({ name: 'menu-authorization' }).onBeforeHandle(({ request, auth }: any) => {
    const pathname = new URL(request.url).pathname;
    if (!pathname.startsWith('/api/menu/')) return;
    requireMenuPermission(auth as AuthContext, permissionFor(pathname, request.method));
  });
