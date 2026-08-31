import { getDomainData, postDomainData, putDomainData, type DomainHttpClient } from "./shared";

export interface ManagerApprovalInput {
  actionType: "VOID" | "COMP";
  orderId: string;
  orderItemId: string;
  managerEmail: string;
  password: string;
}

export interface ManagerApprovalResult {
  token: string;
}

export function createApprovalsApi(client: DomainHttpClient) {
  return {
    requestManagerApproval(input: ManagerApprovalInput): Promise<ManagerApprovalResult> {
      return postDomainData<ManagerApprovalResult>(client, "/approvals/manager", input);
    },
    listThresholds<T>(): Promise<T[]> {
      return getDomainData<T[]>(client, "/approvals/thresholds");
    },
    setThreshold<T>(actionType: string, input: Record<string, unknown>): Promise<T> {
      return putDomainData<T>(client, `/approvals/thresholds/${actionType}`, input);
    },
  };
}
