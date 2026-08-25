import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../shared/lib/query-client';
import { notifyError, notifySuccess } from '../../../shared/lib/notify';
import { menuItemsService } from '../services/menu-items.service';
import { menuKeys } from '../query-keys';

export function useBulkUpdateTags() {
  return useMutation({
    mutationFn: ({ itemIds, tagIds, mode }: { itemIds: string[]; tagIds: string[]; mode: 'add' | 'remove' | 'replace' }) =>
      menuItemsService.bulkUpdateTags(itemIds, tagIds, mode),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
      notifySuccess(`Updated tags on ${data.updated} item(s)`);
    },
    onError: () => notifyError(undefined, 'Failed to update tags'),
  });
}
