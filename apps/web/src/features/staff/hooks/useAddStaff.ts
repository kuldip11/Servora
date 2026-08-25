import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../shared/lib/query-client';
import { notifyError, notifySuccess } from '../../../shared/lib/notify';
import { staffService, type StaffFormInput } from '../services/staff.service';
import { staffKeys } from '../query-keys';

export function useAddStaff() {
  return useMutation({
    mutationFn: (input: StaffFormInput) => staffService.add(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.list() });
      notifySuccess('Staff member added');
    },
    onError: (err) => notifyError(err, 'Failed to add staff'),
  });
}
