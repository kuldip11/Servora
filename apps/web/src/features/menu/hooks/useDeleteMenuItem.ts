import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../shared/lib/query-client';
import { notifySuccess } from '../../../shared/lib/notify';
import { menuItemsService } from '../services/menu-items.service';
import { menuKeys } from '../query-keys';

export function useDeleteMenuItem() {
  return useMutation({
    mutationFn: (id: string) => menuItemsService.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
      notifySuccess('Item deleted');
    },
  });
}
