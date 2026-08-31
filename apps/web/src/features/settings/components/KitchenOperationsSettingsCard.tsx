import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card } from "@pos/ui";
import { ChefHat } from "lucide-react";
import type { Tenant } from "@pos/types";
import { createSettingsApi } from "@pos/api-client";
import { apiClient } from "../../../shared/lib/api-client";

const settingsApi = createSettingsApi(apiClient);
import { notifyError, notifySuccess } from "../../../shared/lib/notify";

type KitchenSettings = Required<Pick<Tenant, "id" | "courseSequencingEnabled">>;

export function KitchenOperationsSettingsCard({ tenantId }: { tenantId: string }) {
  const qc = useQueryClient();
  const [courseSequencingEnabled, setCourseSequencingEnabled] = useState(false);
  const key = ["tenant-settings", tenantId];
  const { data: settings } = useQuery<KitchenSettings>({
    queryKey: key,
    queryFn: async () => {
      const memberships = await settingsApi.tenants<KitchenSettings>();
      const tenant = memberships.find((entry) => entry.tenant.id === tenantId)?.tenant;
      if (!tenant) throw new Error("Active tenant settings are unavailable");
      return tenant;
    },
  });
  useEffect(() => {
    if (settings) setCourseSequencingEnabled(settings.courseSequencingEnabled);
  }, [settings]);
  const save = useMutation({
    mutationFn: () => settingsApi.updateTenant<KitchenSettings>(tenantId, { courseSequencingEnabled }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      notifySuccess("Kitchen operations settings updated");
    },
    onError: (error) => notifyError(error, "Failed to update kitchen operations settings"),
  });

  return <Card>
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50"><ChefHat className="h-5 w-5 text-amber-700" /></div>
      <div><h2 className="text-base font-semibold text-text-primary">Kitchen operations</h2><p className="text-xs text-text-secondary">Optional fine-dining course sequencing</p></div>
    </div>
    <label className="flex items-start gap-3 text-sm text-text-secondary">
      <input type="checkbox" className="mt-1" checked={courseSequencingEnabled} onChange={(event) => setCourseSequencingEnabled(event.target.checked)} />
      <span><strong className="block text-text-primary">Enable course sequencing</strong>Allow staff to explicitly place an order/round into course mode. Ordinary orders remain immediate-fire and unchanged.</span>
    </label>
    <div className="mt-4 flex justify-end"><Button loading={save.isPending} onClick={() => save.mutate()}>Save kitchen settings</Button></div>
  </Card>;
}
