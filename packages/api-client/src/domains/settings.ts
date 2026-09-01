import {
  getDomainData,
  patchDomainData,
  type DomainHttpClient,
} from "./shared";

export const createSettingsApi = (client: DomainHttpClient) => {
  return {
    tenants<T>(): Promise<Array<{ tenant: T }>> {
      return getDomainData<Array<{ tenant: T }>>(client, "/tenants");
    },
    updateTenant<T>(
      tenantId: string,
      patch: Record<string, unknown>,
    ): Promise<T> {
      return patchDomainData<T>(client, `/tenants/${tenantId}`, patch);
    },
  };
};
