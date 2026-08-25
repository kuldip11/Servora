import { describe, expect, it } from 'vitest';
import { branchRequired, ticketNotFound } from '../ticket.errors';

describe('kitchen ticket errors', () => {
  it('creates a stable not-found error', () => {
    expect(ticketNotFound('t1').toJSON()).toMatchObject({ code: 'NOT_FOUND' }); expect(ticketNotFound('t1').statusCode).toBe(404);
  });
  it('creates the missing-branch error with actionable messaging', () => {
    expect(branchRequired().toJSON()).toMatchObject({ code: 'MISSING_BRANCH' }); expect(branchRequired().statusCode).toBe(400);
    expect(branchRequired().message).toContain('specific branch');
  });
});
