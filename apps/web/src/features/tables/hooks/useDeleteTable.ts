import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../shared/lib/query-client';
import { notifyError, notifySuccess } from '../../../shared/lib/notify';
import { tablesService } from '../services/tables.service';
import { tableKeys } from '../query-keys';

export function useDeleteTable() {
  return useMutation({
    mutationFn: (id: string) => tablesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.all });
      notifySuccess('Table removed');
    },
    onError: (err) => notifyError(err, 'Failed to remove table'),
  });
}
