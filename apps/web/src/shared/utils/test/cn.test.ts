import { describe, expect, it } from 'vitest';
import { cn } from '../cn';

describe('cn', () => {
  it('merges conditional class values', () => {
    expect(cn('px-2', false && 'hidden', 'text-sm')).toBe('px-2 text-sm');
  });

  it('resolves conflicting Tailwind utilities', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('accepts arrays and object conditions', () => {
    expect(cn(['font-bold', { 'text-muted': true, hidden: false }])).toBe(
      'font-bold text-muted',
    );
  });
});
