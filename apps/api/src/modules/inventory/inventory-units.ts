import type { InventoryUnit } from "@pos/types";

const unitScale: Record<InventoryUnit, { dimension: "MASS" | "VOLUME" | "COUNT" | "PACKET"; toBase: number }> = {
  KG: { dimension: "MASS", toBase: 1000 },
  GRAMS: { dimension: "MASS", toBase: 1 },
  LITERS: { dimension: "VOLUME", toBase: 1000 },
  ML: { dimension: "VOLUME", toBase: 1 },
  PIECES: { dimension: "COUNT", toBase: 1 },
  PACKETS: { dimension: "PACKET", toBase: 1 },
};

export function areInventoryUnitsCompatible(from: InventoryUnit, to: InventoryUnit): boolean {
  return unitScale[from].dimension === unitScale[to].dimension;
}

export function convertInventoryQuantity(
  quantity: number,
  from: InventoryUnit,
  to: InventoryUnit,
): number {
  if (!Number.isFinite(quantity)) throw new Error("Inventory quantity must be finite");
  if (!areInventoryUnitsCompatible(from, to)) {
    throw new Error(`Incompatible inventory units: ${from} cannot be converted to ${to}`);
  }
  return quantity * unitScale[from].toBase / unitScale[to].toBase;
}
