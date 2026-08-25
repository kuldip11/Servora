import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
  useQueryClient: vi.fn(),
  handlers: [] as Array<[string, () => void]>,
}));

mocks.useQueryClient.mockReturnValue({ invalidateQueries: mocks.invalidateQueries });

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: mocks.useQueryClient,
}));

vi.mock('../../../../shared/lib/realtime', () => ({
  useConnectionStatus: () => true,
  useRealtimeEvent: (type: string, handler: () => void) => mocks.handlers.push([type, handler]),
}));

import { useKitchenRealtime } from '../useKitchenRealtime';
import { KITCHEN_TICKETS_QUERY_KEY } from '../useKitchenTickets';

describe('useKitchenRealtime', () => {
  it('invalidates for realtime events', () => {
    expect(useKitchenRealtime()).toEqual({ connected: true });
    expect(mocks.handlers.map(([type]) => type)).toEqual([
      'kitchen.ticket.created',
      'kitchen.ticket.updated',
    ]);
    mocks.handlers.forEach(([, handler]) => handler());
    expect(mocks.invalidateQueries).toHaveBeenCalledTimes(2);
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: KITCHEN_TICKETS_QUERY_KEY });
  });
});
