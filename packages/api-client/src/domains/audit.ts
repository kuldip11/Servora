import { getDomainData, type DomainHttpClient } from "./shared";

export function createAuditApi(client: DomainHttpClient) {
  return {
    list<T>(params: Record<string, string | number | undefined>): Promise<T> {
      return getDomainData<T>(client, "/audit", { params });
    },
    menuHistory<T>(filters: Record<string, string | number | undefined> = {}): Promise<T> {
      return getDomainData<T>(client, "/menu/history", { params: filters });
    },
  };
}
