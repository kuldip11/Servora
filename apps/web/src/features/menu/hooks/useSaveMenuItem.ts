import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../shared/lib/query-client';
import { notifyError, notifySuccess } from '../../../shared/lib/notify';
import { menuItemsService, type MenuItemFormPayload } from '../services/menu-items.service';
import { menuKeys } from '../query-keys';
import type { MenuItem } from '@pos/types';

export function useSaveMenuItem() {
  return useMutation({
    mutationFn: ({ item, payload }: { item: MenuItem | null; payload: MenuItemFormPayload }) =>
      menuItemsService.saveItem(item, payload),
    onSuccess: (_data, { item }) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
      notifySuccess(item ? 'Item updated' : 'Item added');
    },
    onError: (err) => notifyError(err, 'Failed to save item'),
  });
}
