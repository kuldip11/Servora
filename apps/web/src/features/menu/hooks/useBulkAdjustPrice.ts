import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../shared/lib/query-client';
import { notifyError, notifySuccess } from '../../../shared/lib/notify';
import { menuItemsService } from '../services/menu-items.service';
import { menuKeys } from '../query-keys';

export function useBulkAdjustPrice() {
  return useMutation({
    mutationFn: ({ itemIds, priceChange, mode }: { itemIds: string[]; priceChange: number; mode: 'set' | 'increase' | 'decrease' }) =>
      menuItemsService.bulkAdjustPrice(itemIds, priceChange, mode),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
      notifySuccess(`Repriced ${data.updated} item(s)`);
    },
    onError: () => notifyError(undefined, 'Failed to update prices'),
  });
}
