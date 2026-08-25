import { ArrowLeft, User } from "lucide-react";
import { Card, IconButton, ThemeSwitcher } from "@pos/ui";

interface Props {
  waiterName: string;
  onBack: () => void;
}

/**
 * Phase 16 — Waiter App had no existing settings/profile screen to hang
 * the shared `ThemeSwitcher` on (unlike Admin's `SettingsPage`), so this
 * is a small, single-purpose addition rather than a new settings
 * architecture: one screen, one `Card`, reachable from one extra
 * `IconButton` next to the existing logout button in `WaiterApp` — no
 * new nav item, no change to the bottom nav's two tabs. Follows the
 * same header/back-button shape `MenuPage`/`OrderDetailPage` already
 * use for non-tab screens in this app.
 */
export function ProfilePage({ waiterName, onBack }: Props) {
  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center gap-3 px-4 py-3 bg-surface border-b border-border">
        <IconButton icon={ArrowLeft} aria-label="Back" onClick={onBack} />
        <h1 className="text-base font-semibold text-text-primary">Profile</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <Card className="flex items-center gap-3">
          <div className="w-11 h-11 bg-primary-surface rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-text-primary">{waiterName}</p>
            <p className="text-xs text-text-secondary">Waiter</p>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-text-primary mb-3">
            Appearance
          </h2>
          <ThemeSwitcher label="Theme" />
        </Card>
      </div>
    </div>
  );
}
