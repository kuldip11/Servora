import { createBranchesApi } from "@pos/api-client";
import type { Branch } from "@pos/types";
import { apiClient } from "@/shared/lib/api-client";

const branchesApi = createBranchesApi(apiClient);

export const fetchMyBranch = async (): Promise<Branch | undefined> => {
  return (await branchesApi.list())[0];
};
