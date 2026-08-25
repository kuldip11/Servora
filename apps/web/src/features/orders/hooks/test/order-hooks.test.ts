import { beforeEach, describe, expect, it, vi } from 'vitest';

const query = vi.hoisted(() => ({ useQuery: vi.fn((config: unknown) => config), useMutation: vi.fn((config: unknown) => config) }));
const queryClient = vi.hoisted(() => ({ invalidateQueries: vi.fn() }));
const notify = vi.hoisted(() => ({ notifySuccess: vi.fn(), notifyError: vi.fn() }));
const ordersService = vi.hoisted(() => ({ updateStatus: vi.fn(), updateTicketStatus: vi.fn() }));

vi.mock('@tanstack/react-query', () => query);
vi.mock('../../../../shared/lib/query-client', () => ({ queryClient }));
vi.mock('../../../../shared/lib/notify', () => notify);
vi.mock('../../services/orders.service', () => ({ ordersService }));

vi.mock('../../query-options', () => ({
  orderDetailQuery: (id: string) => ({ queryKey: ['order', id], queryFn: vi.fn() }),
  ordersListQuery: (filters: unknown) => ({ queryKey: ['orders', filters], queryFn: vi.fn() }),
}));
vi.mock('../../query-keys', () => ({ orderKeys: { all: ['orders'], detail: (id: string) => ['orders', id] } }));
vi.mock('../../../tables/query-keys', () => ({ tableKeys: { all: ['tables'] } }));

import { useOrder } from '../useOrder';
import { useOrders } from '../useOrders';
import { useUpdateOrderStatus } from '../useUpdateOrderStatus';
import { useUpdateTicketStatus } from '../useUpdateTicketStatus';

describe('order hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds detail and list queries with the supplied arguments', () => {
    expect(useOrder('o1')).toMatchObject({ queryKey: ['order', 'o1'] });
    expect(useOrders({ status: 'OPEN' })).toMatchObject({ queryKey: ['orders', { status: 'OPEN' }] });
    expect(query.useQuery).toHaveBeenCalledTimes(2);
  });

  it('updates order status and invalidates related queries on success', () => {
    const mutation: any = useUpdateOrderStatus('o1');
    mutation.mutationFn('READY');
    mutation.onSuccess();

    expect(ordersService.updateStatus).toHaveBeenCalledWith('o1', 'READY');
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['orders', 'o1'] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['orders'] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['tables'] });
    expect(notify.notifySuccess).toHaveBeenCalledWith('Order status updated');
  });

  it('handles order and ticket status errors and success callbacks', () => {
    const orderMutation: any = useUpdateOrderStatus('o1');
    const ticketMutation: any = useUpdateTicketStatus('o1');
    const error = new Error('boom');

    orderMutation.onError(error);
    ticketMutation.mutationFn({ ticketId: 't1', status: 'READY' });
    ticketMutation.onSuccess();
    ticketMutation.onError(error);

    expect(ordersService.updateTicketStatus).toHaveBeenCalledWith('t1', 'READY');
    expect(notify.notifySuccess).toHaveBeenCalledWith('Ticket updated');
    expect(notify.notifyError).toHaveBeenCalledWith(error, 'Failed to update status');
    expect(notify.notifyError).toHaveBeenCalledWith(error, 'Failed to update ticket');
  });
});
