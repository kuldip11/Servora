import { useQuery } from "@tanstack/react-query";
import type { Tenant } from "@pos/types";
import { activeFranchiseId } from "../../../shared/lib/query-context";
import { apiClient } from "../../../shared/lib/api-client";

export function useCourseSequencingEnabled(): boolean {
  const tenantId = activeFranchiseId();
  const { data } = useQuery({
    queryKey: ["tenant-settings", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const memberships = (await apiClient.get("/tenants")).data.data as Array<{ tenant: Tenant }>;
      return memberships.find((entry) => entry.tenant.id === tenantId)?.tenant ?? null;
    },
  });
  return data?.courseSequencingEnabled === true;
}
