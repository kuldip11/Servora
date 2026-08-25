import { describe, expect, it } from 'vitest';
import { modifierGroupFormSchema } from '../modifiers';

const valid = { name: ' Extras ', selectionType: 'MULTIPLE' as const, minSelections: '0', maxSelections: '', options: [{ name: 'Cheese', additionalPrice: '20', maxQuantity: '1' }] };

describe('modifierGroupFormSchema', () => {
  it('accepts a valid group and trims names', () => expect(modifierGroupFormSchema.parse(valid).name).toBe('Extras'));
  it('requires at least one option', () => expect(modifierGroupFormSchema.safeParse({ ...valid, options: [] }).success).toBe(false));
  it('validates option price and quantity boundaries', () => {
    expect(modifierGroupFormSchema.safeParse({ ...valid, options: [{ name: 'x', additionalPrice: '-1', maxQuantity: '1' }] }).success).toBe(false);
    expect(modifierGroupFormSchema.safeParse({ ...valid, options: [{ name: 'x', additionalPrice: '1', maxQuantity: '101' }] }).success).toBe(false);
  });
  it('rejects maximum below minimum', () => expect(modifierGroupFormSchema.safeParse({ ...valid, minSelections: '3', maxSelections: '2' }).success).toBe(false));
  it('rejects SINGLE selection groups with maximum above one', () => expect(modifierGroupFormSchema.safeParse({ ...valid, selectionType: 'SINGLE', maxSelections: '2' }).success).toBe(false));
  it('accepts blank maximum for multiple selection groups', () => expect(modifierGroupFormSchema.safeParse(valid).success).toBe(true));
});
