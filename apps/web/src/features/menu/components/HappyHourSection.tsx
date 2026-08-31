import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button, Input, Select } from "@pos/ui";
import { createMenuApi } from "@pos/api-client";
import { apiClient } from "../../../shared/lib/api-client";

const menuApi = createMenuApi(apiClient);
import { useMenuCategories } from "../hooks/useMenuCategories";
import { useMenus } from "../hooks/useMenus";

function apiErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const response = "response" in error ? (error as { response?: unknown }).response : undefined;
  if (!response || typeof response !== "object") return null;
  const data = "data" in response ? (response as { data?: unknown }).data : undefined;
  if (!data || typeof data !== "object") return null;
  const apiError = "error" in data ? (data as { error?: unknown }).error : undefined;
  if (!apiError || typeof apiError !== "object") return null;
  const message = "message" in apiError ? (apiError as { message?: unknown }).message : undefined;
  return typeof message === "string" ? message : null;
}

export function HappyHourSection() {
  const { data: categories = [] } = useMenuCategories();
  const { data: menus = [] } = useMenus();
  const [scopeType, setScopeType] = useState<"CATEGORY" | "MENU">("CATEGORY");
  const [scopeId, setScopeId] = useState("");
  const [percentOff, setPercentOff] = useState("20");
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("18:00");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [createdCount, setCreatedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scopeOptions = scopeType === "CATEGORY"
    ? categories.map((category) => ({ value: category.id, label: category.name }))
    : menus.map((menu) => ({ value: menu.id, label: menu.name }));

  const create = useMutation({
    mutationFn: async () => await menuApi.createHappyHourRule<unknown[]>({
      ...(scopeType === "CATEGORY" ? { categoryId: scopeId } : { menuId: scopeId }),
      percentOff: Number(percentOff),
      startTime,
      endTime,
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    }),
    onSuccess: (rows) => {
      setError(null);
      setCreatedCount(rows.length);
    },
    onError: (err: unknown) => {
      setCreatedCount(null);
      setError(apiErrorMessage(err) ?? "Could not create happy-hour rules");
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-text-primary">Happy hour</h2>
        <p className="text-sm text-text-secondary">
          Bulk-create recurring percentage price rules. Runtime pricing still resolves through PricingPipeline stage 1.
        </p>
      </div>
      <div className="grid max-w-4xl gap-3 rounded-xl border border-border p-4 md:grid-cols-3">
        <Select
          label="Scope"
          value={scopeType}
          onChange={(event) => {
            setScopeType(event.target.value as "CATEGORY" | "MENU");
            setScopeId("");
          }}
          options={[{ value: "CATEGORY", label: "Category" }, { value: "MENU", label: "Whole menu" }]}
        />
        <Select
          label={scopeType === "CATEGORY" ? "Category" : "Menu"}
          value={scopeId}
          onChange={(event) => setScopeId(event.target.value)}
          options={[{ value: "", label: `Choose ${scopeType === "CATEGORY" ? "category" : "menu"}` }, ...scopeOptions]}
        />
        <Input label="Percent off" type="number" min={0.01} max={100} step="0.01" value={percentOff} onChange={(event) => setPercentOff(event.target.value)} />
        <Input label="Starts daily" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
        <Input label="Ends daily" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
        <div />
        <Input label="Start date (optional)" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        <Input label="End date (optional)" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        <div className="flex items-end">
          <Button
            loading={create.isPending}
            disabled={!scopeId || Number(percentOff) <= 0 || Number(percentOff) > 100 || !startTime || !endTime}
            onClick={() => create.mutate()}
          >
            Create happy hour
          </Button>
        </div>
      </div>
      {createdCount !== null ? <p className="text-sm text-success">Created {createdCount} price rule{createdCount === 1 ? "" : "s"}.</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
