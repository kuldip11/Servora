import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../shared/lib/query-client';
import { notifyError, notifySuccess } from '../../../shared/lib/notify';
import { menuItemsService } from '../services/menu-items.service';
import { menuKeys } from '../query-keys';
import type { MenuItemStatus } from '@pos/types';

export function useBulkSetStatus() {
  return useMutation({
    mutationFn: ({ itemIds, status, reason }: { itemIds: string[]; status: MenuItemStatus; reason?: string }) =>
      menuItemsService.bulkSetStatus(itemIds, status, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
      notifySuccess(`Updated status for ${data.updated} item(s)`);
    },
    onError: () => notifyError(undefined, 'Failed to update status'),
  });
}
