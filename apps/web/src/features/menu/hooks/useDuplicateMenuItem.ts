import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../shared/lib/query-client';
import { notifyError, notifySuccess } from '../../../shared/lib/notify';
import { menuItemsService } from '../services/menu-items.service';
import { menuKeys } from '../query-keys';

// Duplicates with default copy options (modifiers copied, recipes/schedules
// not — see POST /menu/items/:id/duplicate). Callers should open the
// returned item straight into edit mode so the user can rename/reprice it
// immediately instead of hunting for the copy in the list.
export function useDuplicateMenuItem() {
  return useMutation({
    mutationFn: (id: string) => menuItemsService.duplicateItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
      notifySuccess('Item duplicated');
    },
    onError: (err) => notifyError(err, 'Failed to duplicate item'),
  });
}
