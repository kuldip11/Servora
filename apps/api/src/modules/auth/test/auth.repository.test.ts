import { beforeEach, describe, expect, it, vi } from 'vitest';
const {findFirst,findMany,insert,update,tx,db}=vi.hoisted(()=>{const tx:any={insert:vi.fn(),select:vi.fn()}; const findFirst=vi.fn(),findMany=vi.fn(),insert=vi.fn(),update=vi.fn(); const db:any={query:{users:{findFirst,findMany},tenantMemberships:{findFirst},roles:{findFirst}},insert,update,transaction:vi.fn(async(fn:any)=>fn(tx))}; return {findFirst,findMany,insert,update,tx,db};});
vi.mock('../../../db',()=>({db}));
import { authRepository } from '../auth.repository';
const returning=(rows:any[])=>vi.fn().mockResolvedValue(rows);
beforeEach(() => { vi.clearAllMocks(); });
describe('auth repository',()=>{
  it('normalizes email for user lookups and creation',async()=>{ findFirst.mockResolvedValue({id:'u1'}); await authRepository.findUserByEmail(' A@Example.COM '); expect(findFirst).toHaveBeenCalled(); const values = vi.fn().mockReturnValue({returning:returning([{id:'u1'}])}); insert.mockReturnValue({values}); await expect(authRepository.createUser({firstName:'A',lastName:'B',email:' A@Example.COM ',passwordHash:'h'})).resolves.toEqual({id:'u1'}); expect(values).toHaveBeenCalledWith(expect.objectContaining({email:'a@example.com'})); });
  it('maps refresh token consumption through the update boundary',async()=>{ update.mockReturnValue({set:vi.fn().mockReturnValue({where:vi.fn().mockReturnValue({returning:returning([{id:'rt1'}])})})}); await expect(authRepository.consumeRefreshToken('hash')).resolves.toEqual({id:'rt1'}); });
  it('returns empty-safe lookup collections and membership queries',async()=>{ findMany.mockResolvedValue([]); await expect(authRepository.findUsersByEmail('x@example.com')).resolves.toEqual([]); findFirst.mockResolvedValue({id:'m1',userId:'u1'}); await expect(authRepository.findMembershipById('m1')).resolves.toEqual({id:'m1',userId:'u1'}); });
});
