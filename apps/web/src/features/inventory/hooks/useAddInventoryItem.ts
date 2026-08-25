import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../shared/lib/query-client';
import { notifyError, notifySuccess } from '../../../shared/lib/notify';
import { inventoryService, type InventoryItemFormInput } from '../services/inventory.service';
import { inventoryKeys } from '../query-keys';

export function useAddInventoryItem() {
  return useMutation({
    mutationFn: (input: InventoryItemFormInput) => inventoryService.add(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.items() });
      notifySuccess('Item added to inventory');
    },
    onError: (err) => notifyError(err, 'Failed to add item'),
  });
}
