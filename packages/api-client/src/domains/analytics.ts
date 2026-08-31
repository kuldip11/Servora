import { getDomainData, type DomainHttpClient } from "./shared";

export function createAnalyticsApi(client: DomainHttpClient) {
  return {
    dashboard<T>(): Promise<T> {
      return getDomainData<T>(client, "/analytics/dashboard");
    },
    costMargin<T>(params: Record<string, string | number | undefined> = {}): Promise<T> {
      return getDomainData<T>(client, "/analytics/cost-margin", { params });
    },
    menuEngineering<T>(windowDays: number): Promise<T> {
      return getDomainData<T>(client, "/analytics/menu-engineering", { params: { windowDays } });
    },
  };
}
