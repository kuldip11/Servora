import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../shared/lib/query-client';
import { notifyError, notifySuccess } from '../../../shared/lib/notify';
import { ordersService, type CreateOrderInput } from '../services/orders.service';
import { orderKeys } from '../query-keys';
import { tableKeys } from '../../tables/query-keys';

export function useCreateOrder() {
  return useMutation({
    mutationFn: (input: CreateOrderInput) => ordersService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: tableKeys.all });
      notifySuccess('Order created successfully!');
    },
    onError: (err) => notifyError(err, 'Failed to create order'),
  });
}
