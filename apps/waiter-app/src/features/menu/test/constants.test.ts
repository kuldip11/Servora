import { describe, expect, it } from 'vitest';
import { ALL_ORDER_TYPES, COURSE_LABELS, FOOD_TYPE_DOT_CLASSES, FOOD_TYPE_FILTERS } from '../constants';

describe('menu constants', () => {
  it('defines course labels and order capabilities', () => {
    expect(COURSE_LABELS).toEqual({ 1: 'Starter', 2: 'Main', 3: 'Dessert' });
    expect(ALL_ORDER_TYPES.map((x) => x.value)).toEqual(['DINE_IN', 'TAKEAWAY', 'DELIVERY']);
  });

  it('defines stable food filters and dot classes', () => {
    expect(FOOD_TYPE_FILTERS.map((x) => x.value)).toEqual(['ALL', 'VEG', 'NON_VEG', 'EGG']);
    expect(FOOD_TYPE_DOT_CLASSES.VEG.fill).toBe('bg-emerald-600');
  });
});
