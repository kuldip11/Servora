import { sign, verify, type SignOptions } from "jsonwebtoken";
import type { User } from "@pos/types";

const NODE_ENV = process.env["NODE_ENV"] ?? "development";
const JWT_SECRET = process.env["JWT_SECRET"] ?? "fallback-dev-secret";
const INSECURE_DEFAULTS = new Set([
  "fallback-dev-secret",
  "your-super-secret-jwt-key-change-in-production",
]);

const assertProductionSecrets = (): void => {
  if (NODE_ENV === "production" && INSECURE_DEFAULTS.has(JWT_SECRET)) {
    throw new Error("JWT_SECRET must be explicitly configured in production");
  }
};

assertProductionSecrets();
const JWT_EXPIRES_IN = (process.env["JWT_EXPIRES_IN"] ?? "15m") as NonNullable<
  SignOptions["expiresIn"]
>;

export interface JwtPayload {
  sub: string;
  app: "web" | "kitchen" | "waiter";
  email: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
}

export const signAccessToken = (
  user: Pick<User, "id" | "email" | "roles">,
  app: JwtPayload["app"] = "web",
): string => {
  const permissions = Array.from(
    new Set(user.roles.flatMap((r) => r.permissions.map((p) => p.key))),
  );
  return sign(
    {
      sub: user.id,
      app,
      email: user.email,
      roles: user.roles.map((r) => r.name),
      permissions,
    } satisfies JwtPayload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return verify(token, JWT_SECRET) as JwtPayload;
};
