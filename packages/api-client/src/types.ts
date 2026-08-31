/**
 * Token/context storage abstraction. Access tokens are session memory; refresh
 * tokens are never exposed to JavaScript; they are rotated in an HttpOnly cookie. Tenant/branch context is a
 * request selector and is never embedded in authentication tokens.
 */
export interface TokenStorageAdapter {
  getAccessToken(): string | null;
  setAccessToken(accessToken: string): void;
  getTenantId?(): string | null;
  getBranchId?(): string | null;
  clear(): void;
}
