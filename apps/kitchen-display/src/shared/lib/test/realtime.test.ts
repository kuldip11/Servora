import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createRealtimeClient: vi.fn(() => ({})),
  useRealtime: vi.fn(),
  useRealtimeEvent: vi.fn(),
  useRealtimeConnection: vi.fn(() => true),
}));

vi.mock('@pos/realtime', () => ({
  createRealtimeClient: mocks.createRealtimeClient,
  useRealtime: mocks.useRealtime,
  useRealtimeEvent: mocks.useRealtimeEvent,
  useRealtimeConnection: mocks.useRealtimeConnection,
}));

import { useConnectionStatus } from '../realtime';

describe('realtime', () => {
  it('creates and exposes connection hook', () => {
    expect(mocks.createRealtimeClient).toHaveBeenCalled();
    expect(useConnectionStatus()).toBe(true);
  });
});
