import { describe, expect, it } from 'vitest';
import { KITCHEN_TICKET_TRANSITIONS, assertValidTransition, canTransition, timestampFieldsFor } from '../ticket-status.machine';

describe('kitchen ticket status machine', () => {
  it('allows only FIRED→PREPARING→READY→SERVED', () => {
    expect(canTransition('FIRED', 'PREPARING')).toBe(true);
    expect(canTransition('PREPARING', 'READY')).toBe(true);
    expect(canTransition('READY', 'SERVED')).toBe(true);
    expect(KITCHEN_TICKET_TRANSITIONS.SERVED).toEqual([]);
  });
  it('rejects skipped/backward transitions', () => {
    expect(canTransition('FIRED', 'READY')).toBe(false);
    expect(canTransition('READY', 'PREPARING')).toBe(false);
    expect(() => assertValidTransition('SERVED', 'READY')).toThrow('Cannot transition kitchen ticket');
  });
  it('stamps ready and served timestamps only on entry to those states', () => {
    expect(timestampFieldsFor('PREPARING')).toEqual({});
    expect(timestampFieldsFor('READY').readyAt).toBeInstanceOf(Date);
    expect(timestampFieldsFor('SERVED').servedAt).toBeInstanceOf(Date);
  });
});
