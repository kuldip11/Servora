import type { StatusTone } from "@pos/ui";
import type { TableFormValues } from "../table-form.types";
import type { RestaurantTable } from "../types";

export const TABLE_STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Available" },
  { value: "OCCUPIED", label: "Occupied" },
  { value: "CLEANING", label: "Cleaning" },
  { value: "RESERVED", label: "Reserved" },
] as const;

export const TABLE_STATUS_TONES: Record<RestaurantTable["status"], StatusTone> = { AVAILABLE: "success", OCCUPIED: "danger", CLEANING: "info", RESERVED: "warning" };
export const TABLE_STATUS_CARD_BORDER: Record<RestaurantTable["status"], string> = { AVAILABLE: "border-emerald-200", OCCUPIED: "border-red-200", CLEANING: "border-blue-200", RESERVED: "border-amber-200" };
export const EMPTY_TABLE_FORM: TableFormValues = { name: "", capacity: "4", section: "", branchId: "" };
