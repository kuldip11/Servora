import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@pos/ui';
import { updateOrderStatus } from '../api/orders';
import { orderKeys } from '../constants';

export function useUpdateOrderStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orderKeys.all });
      qc.invalidateQueries({ queryKey: ['order'] });
      qc.invalidateQueries({ queryKey: ['tables'] });
      toast({ title: 'Order updated', tone: 'success' });
    },
    onError: () => toast({ title: 'Failed to update', tone: 'danger' }),
  });
}
