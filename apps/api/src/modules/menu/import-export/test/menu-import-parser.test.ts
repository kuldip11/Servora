import { describe, expect, it } from 'vitest';
import { buildTemplate, parseFile, validateRows } from '../menu-import-parser';

describe('menu import parser', () => {
  it('builds both CSV and XLSX templates', () => {
    const csv = buildTemplate('csv');
    const xlsx = buildTemplate('xlsx');
    expect(csv.contentType).toBe('text/csv');
    expect(String(csv.content)).toContain('Margherita Pizza');
    expect(xlsx.contentType).toContain('spreadsheetml');
    expect(xlsx.content).toBeTruthy();
  });
  it('parses exported CSV rows and validates malformed/duplicate input', () => {
    const csv = buildTemplate('csv');
    const rows = parseFile(new TextEncoder().encode(String(csv.content)).buffer, 'menu.csv');
    expect(rows[0]).toMatchObject({ name: 'Margherita Pizza', category: 'Pizza' });
    const result = validateRows([
      rows[0]!,
      { ...rows[0]!, sku: 'PIZZA-001' },
    ], new Map([['pizza', 'cat-1']]), new Set(), new Map());
    expect(result.valid).toHaveLength(1);
    expect(result.errors.some((e) => e.field === 'sku')).toBe(true);
  });
});
