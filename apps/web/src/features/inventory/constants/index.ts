export const INVENTORY_UNIT_OPTIONS = [
  { value: "KG", label: "Kilograms (KG)" }, { value: "GRAMS", label: "Grams (g)" }, { value: "LITERS", label: "Liters (L)" }, { value: "ML", label: "Milliliters (ml)" }, { value: "PIECES", label: "Pieces" }, { value: "PACKETS", label: "Packets" },
] as const;
export const INVENTORY_TRANSACTION_OPTIONS = [
  { value: "IN", label: "Stock In" }, { value: "OUT", label: "Stock Out" }, { value: "ADJUSTMENT", label: "Adjustment" },
] as const;
