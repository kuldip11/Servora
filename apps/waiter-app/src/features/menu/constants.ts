export const COURSE_LABELS = { 1: "Starter", 2: "Main", 3: "Dessert" } as const;

export const FOOD_TYPE_DOT_CLASSES = {
  VEG: { border: "border-emerald-600", fill: "bg-emerald-600" },
  NON_VEG: { border: "border-red-600", fill: "bg-red-600" },
  EGG: { border: "border-amber-600", fill: "bg-amber-600" },
} as const;

export const ALL_ORDER_TYPES = [
  {
    value: "DINE_IN" as const,
    label: "Dine In",
    capabilityKey: "dineInEnabled" as const,
  },
  {
    value: "TAKEAWAY" as const,
    label: "Takeaway",
    capabilityKey: "takeawayEnabled" as const,
  },
  {
    value: "DELIVERY" as const,
    label: "Delivery",
    capabilityKey: "deliveryEnabled" as const,
  },
];

export const FOOD_TYPE_FILTERS = [
  { value: "ALL" as const, label: "All" },
  { value: "VEG" as const, label: "Veg" },
  { value: "NON_VEG" as const, label: "Non-Veg" },
  { value: "EGG" as const, label: "Egg" },
];
