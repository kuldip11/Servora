import { STORAGE_KEYS } from '../../shared/constants/storage-keys';
export function saveTokens(accessToken: string, refreshToken: string) { sessionStorage.setItem(STORAGE_KEYS.token, accessToken); sessionStorage.setItem(STORAGE_KEYS.refresh, refreshToken); }
export function clearTokens() { sessionStorage.removeItem(STORAGE_KEYS.token); sessionStorage.removeItem(STORAGE_KEYS.refresh); sessionStorage.removeItem(STORAGE_KEYS.tenant); sessionStorage.removeItem(STORAGE_KEYS.branch); }
export function saveContext(franchiseId: string, branchId: string | null) { sessionStorage.setItem(STORAGE_KEYS.tenant, franchiseId); if (branchId) sessionStorage.setItem(STORAGE_KEYS.branch, branchId); else sessionStorage.removeItem(STORAGE_KEYS.branch); }
export function getToken(): string | null { return sessionStorage.getItem(STORAGE_KEYS.token); }
export function logout() { Object.values(STORAGE_KEYS).forEach((key) => sessionStorage.removeItem(key)); }
