import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRealtime, useRealtimeConnection, useRealtimeEvent } from '../use-realtime';
import type { RealtimeClient } from '../create-realtime-client';

type Event = { type: 'order.created' | 'ping'; id?: string };

function fakeClient(initialConnected = false) {
  let connected = initialConnected;
  const handlers = new Set<(event: Event) => void>();
  const listeners = new Set<(value: boolean) => void>();
  return {
    emit: (event: Event) => handlers.forEach((handler) => handler(event)),
    setConnected: (value: boolean) => {
      connected = value;
      listeners.forEach((listener) => listener(value));
    },
    subscribe: vi.fn((handler: (event: Event) => void) => {
      handlers.add(handler);
      return () => handlers.delete(handler);
    }),
    isConnected: vi.fn(() => connected),
    onConnectionChange: vi.fn((listener: (value: boolean) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
    reconnect: vi.fn(),
  } satisfies RealtimeClient<Event> & { emit: (event: Event) => void; setConnected: (value: boolean) => void };
}

describe('useRealtime', () => {
  it('subscribes for the client lifetime and uses the latest handler without resubscribing', () => {
    const client = fakeClient();
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();
    const { rerender, unmount } = renderHook(({ handler }) => useRealtime(client, handler), {
      initialProps: { handler: firstHandler },
    });

    expect(client.subscribe).toHaveBeenCalledOnce();
    client.emit({ type: 'ping' });
    expect(firstHandler).toHaveBeenCalledOnce();

    rerender({ handler: secondHandler });
    expect(client.subscribe).toHaveBeenCalledOnce();
    client.emit({ type: 'ping' });
    expect(secondHandler).toHaveBeenCalledOnce();
    expect(firstHandler).toHaveBeenCalledOnce();

    unmount();
    expect(client.subscribe.mock.results[0]!.value).toBeTypeOf('function');
  });
});

describe('useRealtimeEvent', () => {
  it('only forwards events matching the requested type', () => {
    const client = fakeClient();
    const handler = vi.fn();
    renderHook(() => useRealtimeEvent(client, 'order.created', handler));

    act(() => client.emit({ type: 'ping' }));
    expect(handler).not.toHaveBeenCalled();
    act(() => client.emit({ type: 'order.created', id: '123' }));
    expect(handler).toHaveBeenCalledWith({ type: 'order.created', id: '123' });
  });
});

describe('useRealtimeConnection', () => {
  it('starts from the client state and tracks connection changes', () => {
    const client = fakeClient(true);
    const { result } = renderHook(() => useRealtimeConnection(client));
    expect(result.current).toBe(true);

    act(() => client.setConnected(false));
    expect(result.current).toBe(false);
    act(() => client.setConnected(true));
    expect(result.current).toBe(true);
    expect(client.onConnectionChange).toHaveBeenCalledOnce();
  });
});
