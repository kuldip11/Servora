import { env } from "@/config/env";
import type { AuthApp } from "./auth-app";

const refreshCookieName = (app: AuthApp): string => `servora_refresh_${app}`;

export const REFRESH_COOKIE_NAME = refreshCookieName("web");

const cookieBase = (app: AuthApp): string[] => {
  return [
    `${refreshCookieName(app)}=`,
    "Path=/api/auth",
    "HttpOnly",
    env.NODE_ENV === "production" ? "Secure" : "",
    env.NODE_ENV === "production" ? "SameSite=None" : "SameSite=Lax",
  ].filter(Boolean);
};

export const serializeRefreshCookie = (
  token: string,
  app: AuthApp = "web",
): string => {
  const maxAge = 7 * 24 * 60 * 60;
  const parts = cookieBase(app);
  parts[0] = `${refreshCookieName(app)}=${encodeURIComponent(token)}`;
  parts.push(`Max-Age=${maxAge}`);
  return parts.join("; ");
};

export const clearRefreshCookie = (app: AuthApp = "web"): string => {
  const parts = cookieBase(app);
  parts.push("Max-Age=0", "Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  return parts.join("; ");
};

export const readRefreshCookie = (
  cookieHeader: string | undefined,
  app: AuthApp = "web",
): string | null => {
  if (!cookieHeader) return null;
  const expectedName = refreshCookieName(app);
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === expectedName) {
      const value = rest.join("=");
      return value ? decodeURIComponent(value) : null;
    }
  }
  return null;
};
