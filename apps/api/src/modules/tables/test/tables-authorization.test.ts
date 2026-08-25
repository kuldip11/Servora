import { describe, expect, it, vi } from 'vitest';
vi.mock('../../../core/auth',()=>({requireBranch:(auth:any,msg:string)=>{if(!auth.branchId) throw new Error(msg);return auth.branchId;},requirePermission:(auth:any,p:string)=>{if(!(auth.permissions??[]).includes(p))throw new Error(`Missing permission: ${p}`);}}));
vi.mock('../../../core/errors',()=>({ForbiddenError:class extends Error{statusCode=403;constructor(message:string){super(message);}}}));
import { requireTablesPermission,resolveTableBranch,assertTableResourceAccess,assertTableListScope } from '../tables-authorization';
const base:any={branchId:'b1',tenantWide:false,authorizedBranchIds:['b1'],permissions:['tables:read']};
describe('tables authorization',()=>{
 it('enforces permissions and branch resolution',()=>{expect(()=>requireTablesPermission(base,'tables:read')).not.toThrow();expect(()=>requireTablesPermission(base,'tables:create')).toThrow('Missing permission');expect(resolveTableBranch(base)).toBe('b1');expect(resolveTableBranch({...base,tenantWide:true,branchId:null},'b9')).toBe('b9');expect(()=>resolveTableBranch(base,'b9')).toThrow('Branch access denied');});
 it('enforces resource and list scope for branch-scoped members',()=>{expect(()=>assertTableResourceAccess(base,'b1')).not.toThrow();expect(()=>assertTableResourceAccess(base,'b9')).toThrow('Branch access denied');expect(()=>assertTableResourceAccess({...base,tenantWide:true,branchId:null},'b9')).not.toThrow();expect(()=>assertTableListScope({...base,branchId:null})).toThrow('Branch access denied');expect(()=>assertTableListScope({...base,branchId:null,tenantWide:true})).not.toThrow();});
});
