/**
 * Token/context storage abstraction. Access tokens are session memory; refresh
 * tokens may be persisted by the consuming app. Tenant/branch context is a
 * request selector and is never embedded in authentication tokens.
 */
export interface TokenStorageAdapter {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(accessToken: string, refreshToken: string): void;
  getTenantId?(): string | null;
  getBranchId?(): string | null;
  clear(): void;
}
