
import {
  UnauthorizedError,
  NotFoundError,
  TooManyRequestsError,
} from "../../core/errors";

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
