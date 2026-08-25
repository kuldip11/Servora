import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../shared/lib/query-client';
import { notifyError } from '../../../shared/lib/notify';
import { menuSchedulesService } from '../services/menu-schedules.service';
import { menuKeys } from '../query-keys';

export function useDeleteSchedule(itemId: string) {
  return useMutation({
    mutationFn: (scheduleId: string) => menuSchedulesService.remove(scheduleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: menuKeys.itemSchedules(itemId) }),
    onError: () => notifyError(undefined, 'Failed to remove schedule'),
  });
}
