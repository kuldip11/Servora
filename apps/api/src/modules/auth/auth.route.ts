import { Elysia } from "elysia";
import { requireAuthPlugin } from "../../core/auth";
import { authController } from "./auth.controller";
import { signupBody, loginBody, refreshBody, profileBody } from "./auth.validator";

// Public endpoints — no bearer token to check yet, so this instance
// deliberately does not mount `requireAuthPlugin()`.
export const authRouter = new Elysia()
  .post("/api/auth/signup", ({ body }) => authController.signup(body), {
    body: signupBody,
  })
  .post("/api/auth/login", ({ body }) => authController.login(body), {
    body: loginBody,
  })
  .post(
    "/api/auth/refresh",
    ({ body }) => authController.refresh(body.refreshToken),
    {
      body: refreshBody,
    },
  );

// `/api/auth/me` needs a resolved `auth` context, so it's a separate
// instance mounted alongside `authRouter` (same split as
// `staffRouter`/`rolesRouter` in `staff.route.ts`).
export const authMeRouter = new Elysia()
  .use(requireAuthPlugin())
  .get("/api/auth/me", ({ auth }) => authController.me(auth))
  .patch(
    "/api/auth/me",
    ({ auth, body }) => authController.updateProfile(auth, body),
    { body: profileBody },
  )
  .get("/api/auth/memberships", ({ auth }) => authController.memberships(auth));
