import { env } from "../../config/env";

export const REFRESH_COOKIE_NAME = "servora_refresh";

function cookieBase(): string[] {
  return [
    `${REFRESH_COOKIE_NAME}=`,
    "Path=/api/auth",
    "HttpOnly",
    env.NODE_ENV === "production" ? "Secure" : "",
    env.NODE_ENV === "production" ? "SameSite=None" : "SameSite=Lax",
  ].filter(Boolean);
}

export function serializeRefreshCookie(token: string): string {
  const maxAge = 7 * 24 * 60 * 60;
  const parts = cookieBase();
  parts[0] = `${REFRESH_COOKIE_NAME}=${encodeURIComponent(token)}`;
  parts.push(`Max-Age=${maxAge}`);
  return parts.join("; ");
}

export function clearRefreshCookie(): string {
  const parts = cookieBase();
  parts.push("Max-Age=0", "Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  return parts.join("; ");
}

export function readRefreshCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === REFRESH_COOKIE_NAME) {
      const value = rest.join("=");
      return value ? decodeURIComponent(value) : null;
    }
  }
  return null;
}
