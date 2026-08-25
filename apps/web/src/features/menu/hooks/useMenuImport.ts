import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../shared/lib/query-client';
import { notifyError, notifySuccess } from '../../../shared/lib/notify';
import { menuImportService } from '../services/menu-import.service';
import { menuKeys } from '../query-keys';

export function useValidateMenuImport() {
  return useMutation({
    mutationFn: (file: File) => menuImportService.validate(file),
    onError: (err) => notifyError(err, 'Failed to read file'),
  });
}

export function useCommitMenuImport() {
  return useMutation({
    mutationFn: (file: File) => menuImportService.commit(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
      notifySuccess(`Imported: ${data.inserted} new, ${data.updated} updated`);
    },
    onError: (err) => notifyError(err, 'Import failed'),
  });
}
