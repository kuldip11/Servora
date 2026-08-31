import type { FoodType } from "@pos/types";

const CONFIG: Record<
  FoodType,
  { border: string; fill: string; label: string }
> = {
  VEG: { border: "border-emerald-600", fill: "bg-emerald-600", label: "Veg" },
  NON_VEG: { border: "border-red-600", fill: "bg-red-600", label: "Non-Veg" },
  EGG: { border: "border-amber-600", fill: "bg-amber-600", label: "Egg" },
};

export function FoodTypeDot({
  type,
  size = "md",
}: {
  type: FoodType;
  size?: "sm" | "md";
}) {
  const cfg = CONFIG[type] ?? CONFIG.VEG;
  const box = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const dot = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";
  return (
    <span
      className={`inline-flex items-center justify-center border-2 rounded-sm ${cfg.border} ${box}`}
      title={cfg.label}
    >
      <span className={`rounded-full ${cfg.fill} ${dot}`} />
    </span>
  );
}
