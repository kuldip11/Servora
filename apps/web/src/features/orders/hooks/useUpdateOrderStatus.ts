import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../shared/lib/query-client';
import { notifyError, notifySuccess } from '../../../shared/lib/notify';
import { ordersService } from '../services/orders.service';
import { orderKeys } from '../query-keys';
import { tableKeys } from '../../tables/query-keys';

export function useUpdateOrderStatus(orderId: string) {
  return useMutation({
    mutationFn: (status: string) => ordersService.updateStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: tableKeys.all });
      notifySuccess('Order status updated');
    },
    onError: (err) => notifyError(err, 'Failed to update status'),
  });
}
