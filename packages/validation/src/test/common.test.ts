import { describe, expect, it } from 'vitest';
import { branchFormSchema, paginationSchema } from '../common';

const branch = {
  name: ' Downtown ', address: '', phone: '', dineInEnabled: true,
  takeawayEnabled: false, deliveryEnabled: false, onlineEnabled: false, tablesEnabled: true,
};

describe('paginationSchema', () => {
  it('defaults missing values', () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, limit: 20 });
  });
  it('coerces numeric strings', () => {
    expect(paginationSchema.parse({ page: '2', limit: '50' })).toEqual({ page: 2, limit: 50 });
  });
  it('enforces page and limit boundaries', () => {
    expect(paginationSchema.safeParse({ page: 0 }).success).toBe(false);
    expect(paginationSchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(paginationSchema.safeParse({ page: 1, limit: 100 }).success).toBe(true);
  });
});

describe('branchFormSchema', () => {
  it('trims the branch name and accepts a valid configuration', () => {
    expect(branchFormSchema.parse(branch).name).toBe('Downtown');
  });
  it('requires at least one order type when dine-in is disabled', () => {
    expect(branchFormSchema.safeParse({ ...branch, dineInEnabled: false, tablesEnabled: false }).success).toBe(false);
    expect(branchFormSchema.safeParse({ ...branch, dineInEnabled: false, tablesEnabled: false, takeawayEnabled: true }).success).toBe(true);
  });
  it('rejects tables when dine-in is disabled', () => {
    const result = branchFormSchema.safeParse({ ...branch, dineInEnabled: false, tablesEnabled: true, takeawayEnabled: true });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((i) => i.path[0] === 'tablesEnabled')).toBe(true);
  });
  it('enforces name, address, and phone lengths', () => {
    expect(branchFormSchema.safeParse({ ...branch, name: ' '.repeat(151) }).success).toBe(false);
    expect(branchFormSchema.safeParse({ ...branch, address: 'a'.repeat(501) }).success).toBe(false);
    expect(branchFormSchema.safeParse({ ...branch, phone: '1'.repeat(31) }).success).toBe(false);
  });
});
