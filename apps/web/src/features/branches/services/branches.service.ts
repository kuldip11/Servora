import { createBranchesApi, type BranchInput } from "@pos/api-client";
import { apiClient } from "../../../shared/lib/api-client";

const branchesApi = createBranchesApi(apiClient);

export type BranchFormInput = BranchInput;
export const branchesService = branchesApi;
