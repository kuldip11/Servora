import { describe, expect, it } from 'vitest';
import { branchNotFound, allOrderTypesDisabled, branchHasOpenDineInOrders, lastActiveBranch, branchHasOpenOrders } from '../branch.errors';
describe('branch errors', () => {
  it('creates a stable not-found error with the branch id', () => {
    const error = branchNotFound('b1');
    expect(error.toJSON()).toMatchObject({ code: 'NOT_FOUND' });
    expect(error.message).toBe('Branch with id b1 not found');
    expect(error.details).toBeUndefined();
  });
  it('preserves branch conflict reasons and messages', () => {
    expect(allOrderTypesDisabled().details).toMatchObject({ reason: 'ALL_ORDER_TYPES_DISABLED' });
    expect(branchHasOpenDineInOrders().details).toMatchObject({ reason: 'BRANCH_HAS_OPEN_DINE_IN_ORDERS' });
    expect(lastActiveBranch().details).toMatchObject({ reason: 'LAST_BRANCH' });
    expect(branchHasOpenOrders().details).toMatchObject({ reason: 'BRANCH_HAS_OPEN_ORDERS' });
    expect(lastActiveBranch().statusCode).toBe(409);
  });
});
