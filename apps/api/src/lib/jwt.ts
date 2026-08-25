import { sign, verify, type SignOptions } from 'jsonwebtoken';
import type { User } from '@pos/types';

const NODE_ENV = process.env['NODE_ENV'] ?? 'development';
const JWT_SECRET = process.env['JWT_SECRET'] ?? 'fallback-dev-secret';
const REFRESH_TOKEN_SECRET = process.env['REFRESH_TOKEN_SECRET'] ?? 'fallback-refresh-secret';

const INSECURE_DEFAULTS = new Set([
  'fallback-dev-secret',
  'fallback-refresh-secret',
  'your-super-secret-jwt-key-change-in-production',
  'your-refresh-token-secret-change-in-production',
]);

function assertProductionSecrets(): void {
  if (NODE_ENV === 'production' && (INSECURE_DEFAULTS.has(JWT_SECRET) || INSECURE_DEFAULTS.has(REFRESH_TOKEN_SECRET))) {
    throw new Error('JWT_SECRET and REFRESH_TOKEN_SECRET must be explicitly configured in production');
  }
}

assertProductionSecrets();
const JWT_EXPIRES_IN = (process.env['JWT_EXPIRES_IN'] ?? '15m') as NonNullable<SignOptions['expiresIn']>;
const REFRESH_TOKEN_EXPIRES_IN = (process.env['REFRESH_TOKEN_EXPIRES_IN'] ?? '7d') as NonNullable<
  SignOptions['expiresIn']
>;

/**
 * Authentication identity only. Franchise/branch are deliberately absent.
 * They are request context selectors and are resolved server-side on every
 * request against the authenticated user's current access.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  /** Legacy claims accepted only to force a one-time refresh after deployment. */
  tenantId?: string;
  membershipId?: string;
  branchId?: string | null;
  iat?: number;
  exp?: number;
}

export function signAccessToken(user: Pick<User, 'id' | 'email' | 'roles'>): string {
  const permissions = Array.from(new Set(user.roles.flatMap((r) => r.permissions.map((p) => p.key))));
  return sign(
    {
      sub: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.name),
      permissions,
    } satisfies JwtPayload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

export function signRefreshToken(userId: string): string {
  return sign({ sub: userId }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

export function verifyAccessToken(token: string): JwtPayload {
  return verify(token, JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  return verify(token, REFRESH_TOKEN_SECRET) as { sub: string };
}
