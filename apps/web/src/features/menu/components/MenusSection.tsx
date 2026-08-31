import { useState } from "react";
import type { Menu } from "@pos/types";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button, Input, Modal } from "@pos/ui";
import { useBranches } from "../../branches/hooks/useBranches";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import { queryClient } from "../../../shared/lib/query-client";
import {
  useCreateMenu,
  useDeleteMenu,
  useMenus,
  useSetMenuPublished,
  useUpdateMenu,
} from "../hooks/useMenus";

const CHANNELS = ["STAFF", "CUSTOMER_QR"] as const;
const FULFILLMENT_TYPES = ["DINE_IN", "TAKEAWAY", "DELIVERY", "ONLINE"] as const;

export function MenusSection() {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Menu | null>(null);
  const [channels, setChannels] = useState<string[]>([]);
  const [fulfillmentTypes, setFulfillmentTypes] = useState<string[]>([]);
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const { data: menus, isLoading } = useMenus();
  const { data: resolvedMenus = [] } = useQuery<Menu[]>({
    queryKey: ["menus", "active", "origin-preview"],
    queryFn: async () => (await apiClient.get("/menu/menus/active", { params: { channel: "STAFF", fulfillmentType: "DINE_IN" } })).data.data,
  });
  const inheritedMenus = resolvedMenus.filter((menu) => !!menu.organizationId);
  const { data: branches = [] } = useBranches();
  const createMenu = useCreateMenu();
  const setPublished = useSetMenuPublished();
  const deleteMenu = useDeleteMenu();
  const updateMenu = useUpdateMenu();

  function startEditing(menu: Menu) {
    setEditing(menu);
    setChannels(menu.availableChannels ?? [...CHANNELS]);
    setFulfillmentTypes(menu.availableFulfillmentTypes ?? [...FULFILLMENT_TYPES]);
    setBranchIds(menu.availableBranchIds ?? branches.map((branch) => branch.id));
    setEffectiveFrom(menu.effectiveFrom ? new Date(menu.effectiveFrom).toISOString().slice(0, 16) : "");
  }

  function toggle(value: string, values: string[], setValues: (values: string[]) => void) {
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Menus</h2>
        <p className="text-sm text-text-secondary mt-0.5">
          Create independent menu collections. Item assignment becomes available
          in the next membership step.
        </p>
      </div>

      {inheritedMenus.length > 0 && (
        <div className="rounded-lg border border-primary-border bg-primary-surface px-4 py-3">
          <p className="text-sm font-semibold text-primary">Organization-inherited menu active</p>
          <p className="mt-1 text-xs text-text-secondary">{inheritedMenus.map((menu) => menu.name).join(", ")} · tenant-local published menus override these defaults.</p>
        </div>
      )}

      <form
        className="flex max-w-md items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = name.trim();
          if (!trimmed) return;
          createMenu.mutate(
            { name: trimmed },
            { onSuccess: () => setName("") },
          );
        }}
      >
        <Input
          label="New menu"
          placeholder="Weekend Menu"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Button type="submit" loading={createMenu.isPending}>
          <Plus className="h-4 w-4" /> Create
        </Button>
      </form>

      {isLoading ? (
        <p className="text-sm text-text-secondary">Loading menus…</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {menus?.map((menu) => (
            <div key={menu.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-text-primary">{menu.name}</p>
                  {menu.isDefault && (
                    <span className="rounded bg-surface-secondary px-2 py-0.5 text-xs text-text-secondary">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary">{menu.status}</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                loading={setPublished.isPending}
                onClick={() =>
                  setPublished.mutate({
                    id: menu.id,
                    published: menu.status !== "PUBLISHED",
                  })
                }
              >
                {menu.status === "PUBLISHED" ? "Move to draft" : "Publish"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => startEditing(menu)}>
                <Pencil className="h-4 w-4" /> Availability
              </Button>
              {!menu.isDefault && (
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Delete ${menu.name}`}
                  loading={deleteMenu.isPending}
                  onClick={() => {
                    if (confirm(`Delete menu "${menu.name}"?`))
                      deleteMenu.mutate(menu.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Availability — ${editing?.name ?? "menu"}`} size="sm">
        <form className="space-y-5" onSubmit={(event) => {
          event.preventDefault();
          if (!editing) return;
          updateMenu.mutate({
            id: editing.id,
            input: {
              availableChannels: channels.length === CHANNELS.length ? null : channels as Menu["availableChannels"],
              availableFulfillmentTypes: fulfillmentTypes.length === FULFILLMENT_TYPES.length ? null : fulfillmentTypes as Menu["availableFulfillmentTypes"],
              availableBranchIds: branchIds.length === branches.length ? null : branchIds,
              effectiveFrom: effectiveFrom ? new Date(effectiveFrom).toISOString() : null,
            },
          }, { onSuccess: () => setEditing(null) });
        }}>
          <ScopeChoices label="Ordering channels" options={CHANNELS} values={channels} onToggle={(value) => toggle(value, channels, setChannels)} />
          <ScopeChoices label="Fulfillment types" options={FULFILLMENT_TYPES} values={fulfillmentTypes} onToggle={(value) => toggle(value, fulfillmentTypes, setFulfillmentTypes)} />
          <ScopeChoices label="Branches" options={branches.map((branch) => ({ value: branch.id, label: branch.name }))} values={branchIds} onToggle={(value) => toggle(value, branchIds, setBranchIds)} />
          {branchIds.length < branches.length && <p className="rounded bg-warning-surface px-3 py-2 text-xs text-warning">Branch-specific items assigned to this menu are reachable only where the item’s own branch and this menu’s selected branches overlap.</p>}
          {editing && <MenuScheduleEditor menuId={editing.id} />}
          <Input label="Effective from (optional)" type="datetime-local" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} />
          {effectiveFrom && new Date(effectiveFrom) > new Date() && <p className="text-xs text-warning">Pending change · becomes live {new Date(effectiveFrom).toLocaleString()}</p>}
          <p className="text-xs text-text-secondary">Selecting every option makes the menu available everywhere in that group.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" loading={updateMenu.isPending}>Save availability</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function MenuScheduleEditor({ menuId }: { menuId: string }) {
  const [scheduleType, setScheduleType] = useState("DAILY");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("11:00");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const key = ["menus", menuId, "schedules"];
  const { data: schedules = [] } = useQuery<any[]>({ queryKey: key, queryFn: async () => (await apiClient.get(`/menu/menus/${menuId}/schedules`)).data.data });
  const add = useMutation({ mutationFn: () => apiClient.post(`/menu/menus/${menuId}/schedules`, {
    scheduleType,
    ...((scheduleType === "DAILY" || scheduleType === "WEEKLY") ? { startTime, endTime } : {}),
    ...(scheduleType === "WEEKLY" ? { dayOfWeek } : {}),
    ...(scheduleType === "SPECIFIC_DATE" ? { startDate, endDate: endDate || startDate } : {}),
    ...(scheduleType === "HOLIDAY" ? { holidayName } : {}),
  }), onSuccess: () => queryClient.invalidateQueries({ queryKey: key }) });
  const remove = useMutation({ mutationFn: (id: string) => apiClient.delete(`/menu/menus/schedules/${id}`), onSuccess: () => queryClient.invalidateQueries({ queryKey: key }) });
  return <fieldset className="space-y-2">
    <legend className="text-sm font-medium text-text-primary">Menu windows</legend>
    {schedules.map((schedule) => <div key={schedule.id} className="flex items-center justify-between rounded bg-surface-secondary px-3 py-2 text-sm"><span>{schedule.scheduleType}: {schedule.holidayName ?? schedule.startDate ?? `${schedule.startTime?.slice(0, 5)}–${schedule.endTime?.slice(0, 5)}`}</span><button type="button" className="text-danger" onClick={() => remove.mutate(schedule.id)}>Remove</button></div>)}
    <div className="space-y-2 rounded border border-border p-2">
      <select aria-label="Menu schedule type" value={scheduleType} onChange={(event) => setScheduleType(event.target.value)} className="w-full rounded border border-border px-2 py-1"><option value="DAILY">Every day</option><option value="WEEKLY">Weekly</option><option value="SPECIFIC_DATE">Date range</option><option value="HOLIDAY">Holiday</option></select>
      {(scheduleType === "DAILY" || scheduleType === "WEEKLY") && <div className="flex items-center gap-2">{scheduleType === "WEEKLY" && <select aria-label="Day of week" value={dayOfWeek} onChange={(event) => setDayOfWeek(Number(event.target.value))} className="rounded border border-border px-2 py-1">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => <option key={day} value={index}>{day}</option>)}</select>}<input aria-label="Menu start time" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="rounded border border-border px-2 py-1" /><span>to</span><input aria-label="Menu end time" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="rounded border border-border px-2 py-1" /></div>}
      {scheduleType === "SPECIFIC_DATE" && <div className="flex items-center gap-2"><input aria-label="Menu start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="rounded border border-border px-2 py-1" /><span>to</span><input aria-label="Menu end date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="rounded border border-border px-2 py-1" /></div>}
      {scheduleType === "HOLIDAY" && <Input label="Holiday name" value={holidayName} onChange={(event) => setHolidayName(event.target.value)} />}
      <Button type="button" size="sm" variant="secondary" loading={add.isPending} onClick={() => add.mutate()}>Add window</Button>
    </div>
    <p className="text-xs text-text-secondary">With no windows, this menu is active all day.</p>
  </fieldset>;
}

function ScopeChoices({ label, options, values, onToggle }: {
  label: string;
  options: readonly string[] | Array<{ value: string; label: string }>;
  values: string[];
  onToggle: (value: string) => void;
}) {
  return <fieldset>
    <legend className="mb-2 text-sm font-medium text-text-primary">{label}</legend>
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => {
        const value = typeof option === "string" ? option : option.value;
        const text = typeof option === "string" ? option.split("_").join(" ") : option.label;
        return <label key={value} className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" checked={values.includes(value)} onChange={() => onToggle(value)} /> {text}
        </label>;
      })}
    </div>
  </fieldset>;
}
