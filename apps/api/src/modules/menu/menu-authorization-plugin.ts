import { Elysia } from "elysia";
import { requireAuthPlugin } from "../../core/auth";
import {
  requireMenuPermission,
  type MenuPermission,
} from "./menu-authorization";

function permissionFor(pathname: string, method: string): MenuPermission {

  if (/\/manual-override$/.test(pathname)) return "menu:update";
  if (/\/publish$|\/unpublish$/.test(pathname)) return "menu:publish";
  if (pathname.startsWith("/api/menu/price-rules") && method !== "GET") return "menu:pricing:write";
  if (method === "GET") return "menu:read";
  if (method === "POST") return "menu:create";
  if (method === "DELETE") return "menu:delete";
  return "menu:update";
}

export const menuAuthorizationPlugin = () =>
  new Elysia({ name: "menu-authorization" })
    .use(requireAuthPlugin())
    .onBeforeHandle(({ request, auth }) => {
      const pathname = new URL(request.url).pathname;
      if (!pathname.startsWith("/api/menu/")) return;
      requireMenuPermission(
        auth,
        permissionFor(pathname, request.method),
      );
    });
