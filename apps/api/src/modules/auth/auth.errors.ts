/** Authentication error factories with stable client-facing messages and typed status codes. */
import {
  UnauthorizedError,
  NotFoundError,
  TooManyRequestsError,
} from "../../core/errors";

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
  return new TooManyRequestsError(
    "Too many failed login attempts. Try again later.",
    {
      reason: "AUTH_ACCOUNT_LOCKED",
    },
  );
}
