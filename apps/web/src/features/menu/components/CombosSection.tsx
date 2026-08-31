import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Input, Select } from "@pos/ui";
import { createMenuApi } from "@pos/api-client";
import { apiClient } from "@/shared/lib/api-client";

const menuApi = createMenuApi(apiClient);
import { queryClient } from "@/shared/lib/query-client";

type ComboSummary = {
  id: string;
  name: string;
  pricePolicy: "FIXED" | "PERCENT_OFF_SUM";
  slots: Array<{ options: Array<{ isUnlimitedRefill?: boolean }> }>;
};

export const CombosSection = () => {
  const [name, setName] = useState("");
  const [policy, setPolicy] = useState<"FIXED" | "PERCENT_OFF_SUM">("FIXED");
  const [amount, setAmount] = useState("0");
  const [itemId, setItemId] = useState("");
  const [unlimitedRefill, setUnlimitedRefill] = useState(false);
  const { data: combos = [] } = useQuery<ComboSummary[]>({
    queryKey: ["menu", "combos"],
    queryFn: () => menuApi.listCombos<ComboSummary>(),
  });
  const create = useMutation({
    mutationFn: () =>
      menuApi.createCombo<ComboSummary>({
        name,
        pricePolicy: policy,
        ...(policy === "FIXED"
          ? { fixedPrice: Number(amount) }
          : { percentOff: Number(amount) }),
        slots: [
          {
            name: "Choose an item",
            minSelections: 1,
            maxSelections: 1,
            options: [
              {
                menuItemId: itemId,
                upcharge: 0,
                isUnlimitedRefill: unlimitedRefill,
              },
            ],
          },
        ],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu", "combos"] });
      setName("");
      setItemId("");
      setUnlimitedRefill(false);
    },
  });
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold">Combos / set meals</h2>
        <p className="text-sm text-text-secondary">
          Create guided slot-based meals. Components remain normal kitchen and
          inventory items.
        </p>
      </div>
      <div className="grid max-w-2xl grid-cols-2 gap-2">
        <Input
          label="Combo name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Select
          label="Price policy"
          value={policy}
          options={[
            { value: "FIXED", label: "Fixed price" },
            { value: "PERCENT_OFF_SUM", label: "% off item sum" },
          ]}
          onChange={(event) => setPolicy(event.target.value as typeof policy)}
        />
        <Input
          label={policy === "FIXED" ? "Fixed price" : "Percent off"}
          type="number"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <Input
          label="First slot menu item ID"
          value={itemId}
          onChange={(event) => setItemId(event.target.value)}
        />
        <label className="col-span-2 flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={unlimitedRefill}
            onChange={(event) => setUnlimitedRefill(event.target.checked)}
          />
          Unlimited refill for this component (refills fire again at ₹0)
        </label>
        <Button
          disabled={!name || !itemId}
          loading={create.isPending}
          onClick={() => create.mutate()}
        >
          Create combo
        </Button>
      </div>
      {combos.map((combo) => (
        <div key={combo.id} className="rounded border border-border p-3">
          <strong>{combo.name}</strong>
          <span className="ml-2 text-sm text-text-secondary">
            {combo.pricePolicy} · {combo.slots.length} slot(s)
          </span>
          {combo.slots.some((slot) =>
            slot.options.some((option) => option.isUnlimitedRefill),
          ) && (
            <span className="ml-2 rounded bg-success-surface px-2 py-0.5 text-xs font-medium text-success">
              Refill-enabled
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
