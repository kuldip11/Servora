import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Input, Select } from "@pos/ui";
import { ReceiptText } from "lucide-react";
import { createSettingsApi } from "@pos/api-client";
import { apiClient } from "../../../shared/lib/api-client";

const settingsApi = createSettingsApi(apiClient);
import { notifyError, notifySuccess } from "../../../shared/lib/notify";
import type { Tenant } from "@pos/types";

type TenantSettings = Required<Pick<Tenant, "id" | "serviceChargePercent" | "serviceChargeTaxable" | "roundingPolicy" | "defaultTaxMode">>;

export function PricingSettingsCard({ tenantId }: { tenantId: string }) {
  const qc = useQueryClient();
  const [serviceChargePercent, setServiceChargePercent] = useState("");
  const [serviceChargeTaxable, setServiceChargeTaxable] = useState(false);
  const [roundingPolicy, setRoundingPolicy] = useState<TenantSettings["roundingPolicy"]>("NONE");
  const [defaultTaxMode, setDefaultTaxMode] = useState<TenantSettings["defaultTaxMode"]>("EXCLUSIVE");
  const key = ["tenant-settings", tenantId];
  const { data: settings } = useQuery<TenantSettings>({
    queryKey: key,
    queryFn: async () => {
      const memberships = await settingsApi.tenants<TenantSettings>();
      const tenant = memberships.find((entry) => entry.tenant.id === tenantId)?.tenant;
      if (!tenant) throw new Error("Active tenant settings are unavailable");
      return tenant;
    },
  });
  useEffect(() => {
    if (!settings) return;
    setServiceChargePercent(settings.serviceChargePercent ?? "");
    setServiceChargeTaxable(settings.serviceChargeTaxable);
    setRoundingPolicy(settings.roundingPolicy);
    setDefaultTaxMode(settings.defaultTaxMode);
  }, [settings]);
  const save = useMutation({
    mutationFn: () => settingsApi.updateTenant<TenantSettings>(tenantId, {
      serviceChargePercent: serviceChargePercent.trim() === "" ? null : Number(serviceChargePercent),
      serviceChargeTaxable,
      roundingPolicy,
      defaultTaxMode,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); notifySuccess("Pricing settings updated"); },
    onError: (error) => notifyError(error, "Failed to update pricing settings"),
  });
  return <Card>
    <div className="mb-4 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50"><ReceiptText className="h-5 w-5 text-emerald-600" /></div><div><h2 className="text-base font-semibold text-text-primary">Pricing & tax</h2><p className="text-xs text-text-secondary">Authoritative stages 7–9 settings</p></div></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <Input label="Service charge %" type="number" min="0" max="100" value={serviceChargePercent} onChange={(e) => setServiceChargePercent(e.target.value)} />
      <label className="flex items-end gap-2 pb-2 text-sm text-text-secondary"><input type="checkbox" checked={serviceChargeTaxable} onChange={(e) => setServiceChargeTaxable(e.target.checked)} /> Service charge is taxable</label>
      <Select label="Rounding policy" value={roundingPolicy} onChange={(e) => setRoundingPolicy(e.target.value as TenantSettings["roundingPolicy"])} options={[{ value: "NONE", label: "No rounding" }, { value: "NEAREST_1", label: "Nearest 1" }, { value: "NEAREST_5", label: "Nearest 5" }, { value: "NEAREST_10", label: "Nearest 10" }]} />
      <Select label="Default tax mode" value={defaultTaxMode} onChange={(e) => setDefaultTaxMode(e.target.value as TenantSettings["defaultTaxMode"])} options={[{ value: "EXCLUSIVE", label: "Tax exclusive" }, { value: "INCLUSIVE", label: "Tax inclusive" }]} />
    </div>
    <div className="mt-4 flex justify-end"><Button loading={save.isPending} onClick={() => save.mutate()}>Save pricing settings</Button></div>
  </Card>;
}
