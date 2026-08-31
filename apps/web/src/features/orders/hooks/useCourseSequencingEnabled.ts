import { useQuery } from "@tanstack/react-query";
import { activeFranchiseId } from "../../../shared/lib/query-context";
import { createAuthApi } from "@pos/api-client";
import { apiClient } from "../../../shared/lib/api-client";

const authApi = createAuthApi(apiClient);

export function useCourseSequencingEnabled(): boolean {
  const tenantId = activeFranchiseId();
  const { data } = useQuery({
    queryKey: ["tenant-settings", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const memberships = await authApi.listTenants();
      return memberships.find((entry) => entry.tenant.id === tenantId)?.tenant ?? null;
    },
  });
  return data?.courseSequencingEnabled === true;
}
