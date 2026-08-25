import { useQuery } from '@tanstack/react-query';
import { inventoryItemsQuery } from '../query-options';

export function useInventoryItems() {
  return useQuery(inventoryItemsQuery());
}
