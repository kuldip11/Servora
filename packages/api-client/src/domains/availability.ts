import { getDomainData, type DomainHttpClient } from "./shared";

export interface AvailabilityDashboardParams {
  channel: string;
  fulfillmentType: string;
  cause?: string;
}

export function createAvailabilityApi(client: DomainHttpClient) {
  return {
    dashboard<T>(params: AvailabilityDashboardParams): Promise<T> {
      return getDomainData<T>(client, "/menu/availability/dashboard", { params });
    },
  };
}
