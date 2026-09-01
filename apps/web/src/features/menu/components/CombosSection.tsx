import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Card, Input, Select, toast } from "@pos/ui";
import { createMenuApi } from "@pos/api-client";
import { apiClient, extractApiError } from "@/shared/lib/api-client";
import { queryClient } from "@/shared/lib/query-client";
import { useMenuCategories } from "@/features/menu/hooks/useMenuCategories";

const menuApi = createMenuApi(apiClient);

type ComboPolicy = "FIXED" | "PERCENT_OFF_SUM";
type ComboOption = {
  id?: string;
  menuItemId: string;
  variantId?: string | null;
  upcharge: string | number;
  isUnlimitedRefill?: boolean;
};
type ComboSlot = {
  id?: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  options: ComboOption[];
};
type ComboSummary = {
  id: string;
  name: string;
  description?: string | null;
  pricePolicy: ComboPolicy;
  fixedPrice?: string | number | null;
  percentOff?: string | number | null;
  slots: ComboSlot[];
};
type DraftOption = {
  key: string;
  menuItemId: string;
  variantId: string;
  upcharge: string;
  isUnlimitedRefill: boolean;
};
type DraftSlot = {
  key: string;
  name: string;
  minSelections: string;
  maxSelections: string;
  options: DraftOption[];
};

const newKey = () => crypto.randomUUID();
const newOption = (): DraftOption => ({
  key: newKey(),
  menuItemId: "",
  variantId: "",
  upcharge: "0",
  isUnlimitedRefill: false,
});
const newSlot = (name = "Choice 1"): DraftSlot => ({
  key: newKey(),
  name,
  minSelections: "1",
  maxSelections: "1",
  options: [newOption()],
});

export const CombosSection = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [policy, setPolicy] = useState<ComboPolicy>("FIXED");
  const [amount, setAmount] = useState("0");
  const [slots, setSlots] = useState<DraftSlot[]>([newSlot()]);
  const { data: categories = [] } = useMenuCategories();

  const itemChoices = useMemo(
    () =>
      categories.flatMap((category) =>
        (category.menuItems ?? [])
          .filter((item) => item.isPublished && item.status !== "DISCONTINUED")
          .map((item) => ({
            id: item.id,
            label: `${item.name} · ${category.name}`,
            variants: item.variants ?? [],
          })),
      ),
    [categories],
  );

  const { data: combos = [] } = useQuery<ComboSummary[]>({
    queryKey: ["menu", "combos"],
    queryFn: () => menuApi.listCombos<ComboSummary>(),
  });

  const reset = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setPolicy("FIXED");
    setAmount("0");
    setSlots([newSlot()]);
  };

  const payload = useMemo(
    () => ({
      name: name.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      pricePolicy: policy,
      ...(policy === "FIXED"
        ? { fixedPrice: Number(amount) }
        : { percentOff: Number(amount) }),
      slots: slots.map((slot) => ({
        name: slot.name.trim(),
        minSelections: Number(slot.minSelections),
        maxSelections: Number(slot.maxSelections),
        options: slot.options.map((option) => ({
          menuItemId: option.menuItemId,
          ...(option.variantId ? { variantId: option.variantId } : {}),
          upcharge: Number(option.upcharge || 0),
          isUnlimitedRefill: option.isUnlimitedRefill,
        })),
      })),
    }),
    [amount, description, name, policy, slots],
  );

  const valid = Boolean(
    name.trim() &&
    Number.isFinite(Number(amount)) &&
    Number(amount) >= 0 &&
    (policy !== "PERCENT_OFF_SUM" || Number(amount) <= 100) &&
    slots.length > 0 &&
    slots.every((slot) => {
      const min = Number(slot.minSelections);
      const max = Number(slot.maxSelections);
      return (
        slot.name.trim() &&
        Number.isInteger(min) &&
        Number.isInteger(max) &&
        min >= 0 &&
        max >= 1 &&
        min <= max &&
        slot.options.length >= min &&
        slot.options.every((option) => option.menuItemId)
      );
    }),
  );

  const save = useMutation({
    mutationFn: () =>
      editingId
        ? menuApi.updateCombo<ComboSummary>(editingId, payload)
        : menuApi.createCombo<ComboSummary>(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["menu", "combos"] });
      toast({
        title: editingId ? "Combo updated" : "Combo created",
        tone: "success",
      });
      reset();
    },
    onError: (error) =>
      toast({ title: extractApiError(error), tone: "danger" }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => menuApi.removeCombo(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["menu", "combos"] });
      toast({ title: "Combo deleted", tone: "success" });
      if (editingId) reset();
    },
    onError: (error) =>
      toast({ title: extractApiError(error), tone: "danger" }),
  });

  const beginEdit = (combo: ComboSummary) => {
    setEditingId(combo.id);
    setName(combo.name);
    setDescription(combo.description ?? "");
    setPolicy(combo.pricePolicy);
    setAmount(
      String(
        combo.pricePolicy === "FIXED"
          ? (combo.fixedPrice ?? 0)
          : (combo.percentOff ?? 0),
      ),
    );
    setSlots(
      combo.slots.map((slot) => ({
        key: slot.id ?? newKey(),
        name: slot.name,
        minSelections: String(slot.minSelections),
        maxSelections: String(slot.maxSelections),
        options: slot.options.map((option) => ({
          key: option.id ?? newKey(),
          menuItemId: option.menuItemId,
          variantId: option.variantId ?? "",
          upcharge: String(option.upcharge ?? 0),
          isUnlimitedRefill: option.isUnlimitedRefill ?? false,
        })),
      })),
    );
    const editor = document.getElementById("combo-editor");
    if (typeof editor?.scrollIntoView === "function")
      editor.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold">Combos / set meals</h2>
        <p className="text-sm text-text-secondary">
          Build a combo from normal menu items. Add multiple choices to a slot
          when the guest may choose between alternatives.
        </p>
      </div>

      <Card id="combo-editor">
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label="Combo name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            label="Description (optional)"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <Select
            label="Pricing"
            value={policy}
            options={[
              { value: "FIXED", label: "Fixed total" },
              { value: "PERCENT_OFF_SUM", label: "Percent off components" },
            ]}
            onChange={(event) => setPolicy(event.target.value as ComboPolicy)}
          />
          <Input
            label={policy === "FIXED" ? "Fixed price" : "Percent off"}
            type="number"
            min="0"
            max={policy === "PERCENT_OFF_SUM" ? "100" : undefined}
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>

        <div className="mt-5 space-y-4">
          {slots.map((slot, slotIndex) => (
            <div key={slot.key} className="rounded-lg border border-border p-4">
              <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
                <Input
                  label={`Slot ${slotIndex + 1}`}
                  value={slot.name}
                  onChange={(event) =>
                    setSlots((current) =>
                      current.map((value) =>
                        value.key === slot.key
                          ? { ...value, name: event.target.value }
                          : value,
                      ),
                    )
                  }
                />
                <Input
                  label="Minimum"
                  type="number"
                  min="0"
                  value={slot.minSelections}
                  onChange={(event) =>
                    setSlots((current) =>
                      current.map((value) =>
                        value.key === slot.key
                          ? { ...value, minSelections: event.target.value }
                          : value,
                      ),
                    )
                  }
                />
                <Input
                  label="Maximum"
                  type="number"
                  min="1"
                  value={slot.maxSelections}
                  onChange={(event) =>
                    setSlots((current) =>
                      current.map((value) =>
                        value.key === slot.key
                          ? { ...value, maxSelections: event.target.value }
                          : value,
                      ),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={slots.length === 1}
                  onClick={() =>
                    setSlots((current) =>
                      current.filter((value) => value.key !== slot.key),
                    )
                  }
                >
                  Remove slot
                </Button>
              </div>

              <div className="mt-3 space-y-2">
                {slot.options.map((option, optionIndex) => {
                  const selectedItem = itemChoices.find(
                    (item) => item.id === option.menuItemId,
                  );
                  return (
                    <div
                      key={option.key}
                      className="grid gap-2 rounded-md bg-surface-secondary p-3 md:grid-cols-[2fr_1.3fr_1fr_auto_auto] md:items-end"
                    >
                      <Select
                        label={`Choice ${optionIndex + 1}`}
                        value={option.menuItemId}
                        options={[
                          { value: "", label: "Choose an item" },
                          ...itemChoices.map((item) => ({
                            value: item.id,
                            label: item.label,
                          })),
                        ]}
                        onChange={(event) =>
                          setSlots((current) =>
                            current.map((value) =>
                              value.key === slot.key
                                ? {
                                    ...value,
                                    options: value.options.map((candidate) =>
                                      candidate.key === option.key
                                        ? {
                                            ...candidate,
                                            menuItemId: event.target.value,
                                            variantId: "",
                                          }
                                        : candidate,
                                    ),
                                  }
                                : value,
                            ),
                          )
                        }
                      />
                      <Select
                        label="Variant"
                        value={option.variantId}
                        disabled={!selectedItem?.variants.length}
                        options={[
                          { value: "", label: "Default" },
                          ...(selectedItem?.variants ?? []).map((variant) => ({
                            value: variant.id,
                            label: variant.name,
                          })),
                        ]}
                        onChange={(event) =>
                          setSlots((current) =>
                            current.map((value) =>
                              value.key === slot.key
                                ? {
                                    ...value,
                                    options: value.options.map((candidate) =>
                                      candidate.key === option.key
                                        ? {
                                            ...candidate,
                                            variantId: event.target.value,
                                          }
                                        : candidate,
                                    ),
                                  }
                                : value,
                            ),
                          )
                        }
                      />
                      <Input
                        label="Upcharge"
                        type="number"
                        step="0.01"
                        value={option.upcharge}
                        onChange={(event) =>
                          setSlots((current) =>
                            current.map((value) =>
                              value.key === slot.key
                                ? {
                                    ...value,
                                    options: value.options.map((candidate) =>
                                      candidate.key === option.key
                                        ? {
                                            ...candidate,
                                            upcharge: event.target.value,
                                          }
                                        : candidate,
                                    ),
                                  }
                                : value,
                            ),
                          )
                        }
                      />
                      <label className="flex h-10 items-center gap-2 text-sm text-text-primary">
                        <input
                          type="checkbox"
                          checked={option.isUnlimitedRefill}
                          onChange={(event) =>
                            setSlots((current) =>
                              current.map((value) =>
                                value.key === slot.key
                                  ? {
                                      ...value,
                                      options: value.options.map((candidate) =>
                                        candidate.key === option.key
                                          ? {
                                              ...candidate,
                                              isUnlimitedRefill:
                                                event.target.checked,
                                            }
                                          : candidate,
                                      ),
                                    }
                                  : value,
                              ),
                            )
                          }
                        />
                        Refill
                      </label>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={slot.options.length === 1}
                        onClick={() =>
                          setSlots((current) =>
                            current.map((value) =>
                              value.key === slot.key
                                ? {
                                    ...value,
                                    options: value.options.filter(
                                      (candidate) =>
                                        candidate.key !== option.key,
                                    ),
                                  }
                                : value,
                            ),
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setSlots((current) =>
                      current.map((value) =>
                        value.key === slot.key
                          ? {
                              ...value,
                              options: [...value.options, newOption()],
                            }
                          : value,
                      ),
                    )
                  }
                >
                  + Add choice
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setSlots((current) => [
                ...current,
                newSlot(`Choice ${current.length + 1}`),
              ])
            }
          >
            + Add slot
          </Button>
        </div>

        <div className="mt-5 flex gap-2">
          <Button
            disabled={!valid}
            loading={save.isPending}
            onClick={() => save.mutate()}
          >
            {editingId ? "Save combo" : "Create combo"}
          </Button>
          {editingId && (
            <Button type="button" variant="secondary" onClick={reset}>
              Cancel edit
            </Button>
          )}
        </div>
      </Card>

      <div className="space-y-2">
        {combos.map((combo) => (
          <div
            key={combo.id}
            className="flex items-center gap-3 rounded border border-border p-3"
          >
            <div className="min-w-0 flex-1">
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
            <Button
              size="sm"
              variant="secondary"
              onClick={() => beginEdit(combo)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="secondary"
              loading={remove.isPending && remove.variables === combo.id}
              onClick={() => {
                if (confirm(`Delete combo "${combo.name}"?`))
                  remove.mutate(combo.id);
              }}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
