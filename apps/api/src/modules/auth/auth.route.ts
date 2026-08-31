import { Elysia } from "elysia";
import { requireAuthPlugin } from "../../core/auth";
import { authController } from "./auth.controller";
import { authService } from "./auth.service";
import { successResponse } from "../../core/response";
import { invalidRefreshToken } from "./auth.errors";
import { clearRefreshCookie, readRefreshCookie, serializeRefreshCookie } from "./auth-cookie";
import {
  signupBody,
  loginBody,
  profileBody,
  sessionIdParams,
} from "./auth.validator";

export const authRouter = new Elysia()
  .post("/api/auth/signup", ({ body }) => authController.signup(body), {
    body: signupBody,
  })
  .post(
    "/api/auth/login",
    async ({ body, set }) => {
      const { refreshToken, ...result } = await authService.login(body);
      set.headers["set-cookie"] = serializeRefreshCookie(refreshToken);
      return successResponse(result);
    },
    { body: loginBody },
  )
  .post("/api/auth/refresh", async ({ headers, set }) => {
    const refreshToken = readRefreshCookie(headers.cookie);
    if (!refreshToken) throw invalidRefreshToken();
    const { refreshToken: nextRefreshToken, ...result } =
      await authService.refresh(refreshToken);
    set.headers["set-cookie"] = serializeRefreshCookie(nextRefreshToken);
    return successResponse(result);
  })
  .post("/api/auth/logout", async ({ headers, set }) => {
    const refreshToken = readRefreshCookie(headers.cookie);
    if (refreshToken) await authService.logout(refreshToken);
    set.headers["set-cookie"] = clearRefreshCookie();
    return successResponse({ loggedOut: true });
  });

export const authMeRouter = new Elysia()
  .use(requireAuthPlugin())
  .get("/api/auth/me", ({ auth }) => authController.me(auth))
  .patch(
    "/api/auth/me",
    ({ auth, body }) => authController.updateProfile(auth, body),
    { body: profileBody },
  )
  .get("/api/auth/memberships", ({ auth }) => authController.memberships(auth))
  .get("/api/auth/sessions", ({ auth }) => authController.sessions(auth))
  .delete(
    "/api/auth/sessions/:id",
    ({ auth, params }) => authController.revokeSession(auth, params.id),
    { params: sessionIdParams },
  );
