import { describe, expect, it } from 'vitest';
import { Value } from '@sinclair/typebox/value';
import { createBranchBody, updateBranchBody, branchIdParams } from '../branch.validator';
describe('branch validators', () => {
  it('accepts valid create/update payloads and rejects invalid names', () => {
    expect(Value.Check(createBranchBody, { name: 'Main', dineInEnabled: true })).toBe(true);
    expect(Value.Check(createBranchBody, { name: '' })).toBe(false);
    expect(Value.Check(createBranchBody, { name: 'x'.repeat(201) })).toBe(false);
    expect(Value.Check(updateBranchBody, { name: 'Updated', tablesEnabled: false })).toBe(true);
  });
  it('validates branch id params and boolean capability fields', () => {
    expect(Value.Check(branchIdParams, { id: 'b1' })).toBe(true);
    expect(Value.Check(branchIdParams, { id: 1 })).toBe(false);
    expect(Value.Check(updateBranchBody, { dineInEnabled: 'yes' })).toBe(false);
  });
});
