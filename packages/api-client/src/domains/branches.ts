import type { Branch } from "@pos/types";
import { getDomainData, patchDomainData, postDomainData, type DomainHttpClient } from "./shared";

export interface BranchInput {
  name: string;
  code: string;
  timezone: string;
  currency: string;
  address?: string;
  phone?: string;
  dineInEnabled: boolean;
  takeawayEnabled: boolean;
  deliveryEnabled: boolean;
  onlineEnabled: boolean;
  tablesEnabled: boolean;
}

export function createBranchesApi(client: DomainHttpClient) {
  return {
    list(): Promise<Branch[]> {
      return getDomainData<Branch[]>(client, "/branches");
    },
    create(input: BranchInput): Promise<Branch> {
      return postDomainData<Branch>(client, "/branches", input);
    },
    update(id: string, input: BranchInput): Promise<Branch> {
      return patchDomainData<Branch>(client, `/branches/${id}`, input);
    },
    deactivate(id: string): Promise<void> {
      return client.delete(`/branches/${id}`).then(() => undefined);
    },
  };
}
