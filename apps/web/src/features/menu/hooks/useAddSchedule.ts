import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../shared/lib/query-client';
import { notifyError, notifySuccess } from '../../../shared/lib/notify';
import { menuSchedulesService, type ScheduleFormInput } from '../services/menu-schedules.service';
import { menuKeys } from '../query-keys';

export function useAddSchedule(itemId: string) {
  return useMutation({
    mutationFn: (input: ScheduleFormInput) => menuSchedulesService.add(itemId, input),
    onSuccess: () => {
      notifySuccess('Schedule added');
      queryClient.invalidateQueries({ queryKey: menuKeys.itemSchedules(itemId) });
    },
    onError: (err) => notifyError(err, 'Failed to add schedule'),
  });
}
