import { useEffect, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { Building2, ChevronRight, Plus } from 'lucide-react';
import { Button, Input, toast } from '@pos/ui';
import { extractApiError } from '../../../shared/lib/api-client';
import type { AvailableMembership } from '@pos/types';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../../../store/auth';

export function ContextPage() {
  const router = useRouter();
  const { memberships, setContext } = useAuthStore();
  const [items, setItems] = useState<AvailableMembership[]>(memberships);
  const [loading, setLoading] = useState(!memberships.length);
  const [businessName, setBusinessName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (memberships.length) return;
    authService.memberships().then(setItems).catch(() => toast({ title: 'Could not load businesses', tone: 'danger' })).finally(() => setLoading(false));
  }, [memberships.length]);

  function activate(membership: AvailableMembership) {
    const branchId = membership.isGlobalOwner || membership.roles.some((role) => role.scope === 'TENANT')
      ? null
      : membership.branches[0]?.id ?? null;
    setContext({
      membershipId: membership.membershipId,
      franchiseId: membership.tenant.id,
      memberships: items,
      branchId,
    });
    router.navigate({ to: '/dashboard' });
  }

  async function createBusiness() {
    if (!businessName.trim()) return;
    setCreating(true);
    try {
      const created = await authService.createTenant(businessName.trim());
      const next = await authService.memberships();
      setContext({ membershipId: created.membershipId, franchiseId: created.tenant.id, memberships: next, branchId: null });
      toast({ title: 'Business created. Add a branch to get started.', tone: 'success' });
      router.navigate({ to: '/branches' });
    } catch (err: unknown) {
      toast({ title: extractApiError(err), tone: 'danger' });
    } finally { setCreating(false); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-text-secondary">Loading your businesses…</div>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-surface border border-border rounded-xl shadow-card p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Choose a business</h1>
          <p className="text-sm text-text-secondary mt-1">Your access is managed through memberships.</p>
        </div>
        {items.length > 0 && <div className="space-y-3">{items.map((membership) => (
          <button key={membership.membershipId} onClick={() => activate(membership)} className="w-full flex items-center gap-4 p-4 border border-border rounded-lg text-left hover:border-primary transition-colors">
            <Building2 className="w-5 h-5 text-primary" />
            <span className="flex-1"><strong className="block text-text-primary">{membership.tenant.name}</strong><span className="text-xs text-text-secondary">{membership.roles.map((r) => r.name).join(', ')}</span></span>
            <ChevronRight className="w-4 h-4 text-text-disabled" />
          </button>
        ))}</div>}
        <div className="border-t border-border pt-5 space-y-3">
          <h2 className="font-semibold text-text-primary">Create a business</h2>
          <Input label="Business name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="My Restaurant" />
          <Button loading={creating} onClick={createBusiness} disabled={!businessName.trim()} className="w-full"><Plus className="w-4 h-4 mr-2" />Create business</Button>
        </div>
      </div>
    </div>
  );
}
