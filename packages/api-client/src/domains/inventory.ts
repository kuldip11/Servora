import { voidDomainRequest } from "./shared";
import type {
  InventoryItem,
  InventoryRecipeImpact,
  InventoryTransaction,
  WasteReason,
} from "@pos/types";
import type {
  CreateInventoryItemInput,
  UpdateInventoryStockInput,
} from "@pos/validation";
import { getDomainData, postDomainData, type DomainHttpClient } from "./shared";

export interface LogWasteInput {
  quantity: number;
  wasteReasonId: string;
  notes?: string;
}

export const createInventoryApi = (client: DomainHttpClient) => {
  return {
    list(): Promise<InventoryItem[]> {
      return getDomainData<InventoryItem[]>(client, "/inventory/items");
    },
    create(input: CreateInventoryItemInput): Promise<InventoryItem> {
      return postDomainData<InventoryItem>(client, "/inventory/items", input);
    },
    recipeImpact(itemId: string): Promise<InventoryRecipeImpact> {
      return getDomainData<InventoryRecipeImpact>(
        client,
        `/inventory/items/${itemId}/recipe-impact`,
      );
    },
    transactions(): Promise<InventoryTransaction[]> {
      return getDomainData<InventoryTransaction[]>(
        client,
        "/inventory/transactions",
      );
    },
    updateStock(
      itemId: string,
      input: UpdateInventoryStockInput & { wasteReasonId?: string },
    ): Promise<void> {
      return voidDomainRequest(
        client.patch(`/inventory/items/${itemId}/stock`, input),
      );
    },
    wasteReasons(): Promise<WasteReason[]> {
      return getDomainData<WasteReason[]>(client, "/inventory/waste-reasons");
    },
    createWasteReason(label: string): Promise<WasteReason> {
      return postDomainData<WasteReason>(client, "/inventory/waste-reasons", {
        label,
      });
    },
    logWaste(itemId: string, input: LogWasteInput): Promise<void> {
      return voidDomainRequest(
        client.post(`/inventory/items/${itemId}/waste`, input),
      );
    },
  };
};
