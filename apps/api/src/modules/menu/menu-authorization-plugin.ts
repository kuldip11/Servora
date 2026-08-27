import { Elysia } from "elysia";
import { requireAuthPlugin, type AuthContext } from "../../core/auth";
import {
  requireMenuPermission,
  type MenuPermission,
} from "./menu-authorization";

function permissionFor(pathname: string, method: string): MenuPermission {
  if (/\/publish$|\/unpublish$/.test(pathname)) return "menu:publish";
  if (method === "GET") return "menu:read";
  if (method === "POST") return "menu:create";
  if (method === "DELETE") return "menu:delete";
  return "menu:update";
}

/**
 * Central API-boundary permission gate for all menu endpoints.
 *
 * Mounts its own `requireAuthPlugin()` so `auth` is guaranteed to exist here
 * rather than depending on another router's auth derive leaking in — see the
 * scoping note in `core/auth/auth-context.ts`.
 */
export const menuAuthorizationPlugin = () =>
  new Elysia({ name: "menu-authorization" })
    .use(requireAuthPlugin())
    .onBeforeHandle(({ request, auth }: any) => {
      const pathname = new URL(request.url).pathname;
      if (!pathname.startsWith("/api/menu/")) return;
      requireMenuPermission(
        auth as AuthContext,
        permissionFor(pathname, request.method),
      );
    });
