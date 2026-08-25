import { describe, expect, it } from 'vitest';
import { staffNotFound, branchRequiredForStaff } from '../staff.errors';
describe('staff errors',()=>{
 it('creates a stable staff not-found error',()=>{const e=staffNotFound('u1');expect(e.toJSON()).toMatchObject({code:'NOT_FOUND'}); expect(e.statusCode).toBe(404);expect(e.message).toBe('Staff member with id u1 not found');});
 it('creates the branch-required error with a stable message',()=>{const e=branchRequiredForStaff();expect(e.toJSON()).toMatchObject({code:'MISSING_BRANCH'}); expect(e.statusCode).toBe(400);expect(e.message).toContain('specific branch');});
});
