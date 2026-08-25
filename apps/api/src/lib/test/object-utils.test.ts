import { describe, expect, it } from 'vitest';
import { compact } from '../object-utils';

describe('compact', () => {
  it('removes undefined properties while preserving other values', () => {
    expect(compact({ a: 1, b: undefined, c: null, d: false, e: '' })).toEqual({ a: 1, c: null, d: false, e: '' });
  });
  it('returns a new object without mutating the input', () => {
    const input = { a: 1, b: undefined };
    const result = compact(input);
    expect(result).toEqual({ a: 1 });
    expect(input).toEqual({ a: 1, b: undefined });
    expect(result).not.toBe(input);
  });
});
