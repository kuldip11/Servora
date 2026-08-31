

export interface TokenStorageAdapter {
  getAccessToken(): string | null;
  setAccessToken(accessToken: string): void;
  getTenantId?(): string | null;
  getBranchId?(): string | null;
  clear(): void;
}
