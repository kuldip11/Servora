import { useAuthStore } from '../../../store/auth';
import { Card, Page, PageHeader, Grid, StatusBadge, ThemeSwitcher } from '@pos/ui';
import { Building2, User, Shield, Bell, Palette } from 'lucide-react';

export function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <Page>
      <PageHeader
        title="Settings"
        description="Manage your restaurant and account settings"
      />

      <Grid columns={{ base: 1, lg: 2 }} gap="lg">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-violet-600" />
            </div>
            <h2 className="text-base font-semibold text-text-primary">Account</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-text-secondary">Name</span>
              <span className="font-medium text-text-primary">{user?.firstName} {user?.lastName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-text-secondary">Email</span>
              <span className="font-medium text-text-primary">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-text-secondary">Role</span>
              <StatusBadge tone="info" dot={false} label={user?.roles[0]?.name ?? '—'} />
            </div>
          </div>
        </Card>

        {/* Phase 16 — Appearance section. Same icon-box + heading shape
            as every other card on this page; `ThemeSwitcher` (`@pos/ui`)
            owns all the actual theme state/persistence via `useTheme()`,
            this card just gives it a home. Changing the value here
            updates `<html data-theme>` immediately (ThemeProvider's
            effect) and survives reload since ThemeProvider persists to
            localStorage — no extra plumbing needed on this page. */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-violet-600" />
            </div>
            <h2 className="text-base font-semibold text-text-primary">Appearance</h2>
          </div>
          <ThemeSwitcher label="Theme" />
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-base font-semibold text-text-primary">Permissions</h2>
          </div>
          <div className="space-y-2">
            {user?.roles[0]?.permissions?.slice(0, 8).map((perm) => (
              <div key={perm.id} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 bg-success rounded-full" />
                <span className="text-text-secondary">{perm.key}</span>
              </div>
            ))}
            {(user?.roles[0]?.permissions?.length ?? 0) > 8 && (
              <p className="text-xs text-text-disabled pl-3.5">
                +{(user?.roles[0]?.permissions?.length ?? 0) - 8} more permissions
              </p>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-base font-semibold text-text-primary">System Info</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-text-secondary">Tenant ID</span>
              <span className="font-mono text-xs text-text-primary">{user?.tenantId?.slice(0, 12)}…</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-text-secondary">Branch ID</span>
              <span className="font-mono text-xs text-text-primary">{user?.branchId?.slice(0, 12) ?? '—'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-text-secondary">Status</span>
              <StatusBadge tone="success" label="Active" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-base font-semibold text-text-primary">Notifications</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'New orders', enabled: true },
              { label: 'Low stock alerts', enabled: true },
              { label: 'Kitchen ready alerts', enabled: true },
              { label: 'Payment confirmations', enabled: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">{item.label}</span>
                <div className={`w-10 h-5 rounded-full transition-colors duration-base ease-standard ${item.enabled ? 'bg-primary' : 'bg-surface-secondary'}`} />
              </div>
            ))}
          </div>
        </Card>
      </Grid>
    </Page>
  );
}
