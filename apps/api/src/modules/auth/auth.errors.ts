/**
 * Auth-specific error factories.
 *
 * The pre-refactor controller returned ad-hoc `{ code, message }` pairs
 * per catch block (`TENANT_EXISTS`, `MISSING_TENANT`,
 * `AUTH_INVALID_CREDENTIALS`, `AUTH_USER_INACTIVE`,
 * `AUTH_INVALID_REFRESH_TOKEN`, `USER_NOT_FOUND`). Folded into the shared
 * `AppError` taxonomy here — same status codes and message text
 * preserved, original code kept in `details.reason` for log-grep
 * continuity (same pattern as `tables`/`branches`). Verified no frontend
 * client hardcodes the old code strings before making this change — see
 * docs/NEXT_STEPS.md.
 *
 * `login` and `refresh` each collapsed several distinct internal error
 * cases into one fixed client-facing status/message (401 "Invalid
 * credentials" / 401 "Invalid refresh token") in the original controller,
 * regardless of which internal case fired. Preserved here by having the
 * service throw the same fixed error for every case in that group,
 * rather than distinguishing them for the client.
 */
import { UnauthorizedError, NotFoundError, TooManyRequestsError } from "../../core/errors";

/** Covers both "no such user" and "wrong password" — same response either way. */
export function invalidCredentials(): UnauthorizedError {
  return new UnauthorizedError("Invalid credentials", {
    reason: "AUTH_INVALID_CREDENTIALS",
  });
}

export function userInactive(): UnauthorizedError {
  return new UnauthorizedError("Invalid credentials", {
    reason: "AUTH_USER_INACTIVE",
  });
}

/** Covers both "token not found/expired" and "owning user no longer exists". */
export function invalidRefreshToken(): UnauthorizedError {
  return new UnauthorizedError("Invalid refresh token", {
    reason: "AUTH_INVALID_REFRESH_TOKEN",
  });
}

export function authUserNotFound(): NotFoundError {
  return new NotFoundError("User", undefined, { reason: "USER_NOT_FOUND" });
}

export function accountTemporarilyLocked(): TooManyRequestsError {
  return new TooManyRequestsError("Too many failed login attempts. Try again later.", {
    reason: "AUTH_ACCOUNT_LOCKED",
  });
}
