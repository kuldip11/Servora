import {
  UnauthorizedError,
  NotFoundError,
  TooManyRequestsError,
} from "@/core/errors";

export const invalidCredentials = (): UnauthorizedError => {
  return new UnauthorizedError("Invalid credentials", {
    reason: "AUTH_INVALID_CREDENTIALS",
  });
};

export const userInactive = (): UnauthorizedError => {
  return new UnauthorizedError("Invalid credentials", {
    reason: "AUTH_USER_INACTIVE",
  });
};

export const invalidRefreshToken = (): UnauthorizedError => {
  return new UnauthorizedError("Invalid refresh token", {
    reason: "AUTH_INVALID_REFRESH_TOKEN",
  });
};

export const authUserNotFound = (): NotFoundError => {
  return new NotFoundError("User", undefined, { reason: "USER_NOT_FOUND" });
};

export const accountTemporarilyLocked = (): TooManyRequestsError => {
  return new TooManyRequestsError(
    "Too many failed login attempts. Try again later.",
    {
      reason: "AUTH_ACCOUNT_LOCKED",
    },
  );
};
