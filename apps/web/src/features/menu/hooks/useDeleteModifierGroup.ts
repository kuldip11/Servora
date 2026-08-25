import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../shared/lib/query-client';
import { notifyError, notifySuccess } from '../../../shared/lib/notify';
import { modifierGroupsService } from '../services/modifier-groups.service';
import { menuKeys } from '../query-keys';

export function useDeleteModifierGroup() {
  return useMutation({
    mutationFn: (id: string) => modifierGroupsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.modifierGroups() });
      notifySuccess('Modifier group deleted');
    },
    onError: () => notifyError(undefined, 'Failed to delete — it may still be attached to items'),
  });
}
