import { useState } from 'react';
import {
  AppShell,
  Page,
  PageHeader,
  Section,
  Card,
  Stack,
  Grid,
  Button,
  StatusBadge,
  Dialog,
  Drawer,
  BottomSheet,
  Popover,
  DropdownMenu,
  ContextMenu,
  Tooltip,
  TooltipProvider,
  Toaster,
  toast,
} from '@pos/ui';
import { MoreVertical, Pencil, Trash2, Copy, Info } from 'lucide-react';

/**
 * Internal-only route (`/dev/overlay-preview`, no auth guard). Phase 5
 * exit criteria (docs/design-system/00-PLAN.md): "every overlay traps
 * focus, restores focus on close, closes on Escape/outside-click
 * consistently." Every overlay below is a Phase 5 component — nothing
 * hand-rolled — including a `TooltipProvider`/`Toaster` scoped to just
 * this page, since neither is wired into `apps/web`'s real
 * `main.tsx` yet (see `docs/design-system/README.md`'s Phase 5 section
 * for why).
 *
 * Manual checks to run against this page before calling Phase 5 done:
 * - Open the Dialog, Drawer, and Bottom Sheet one at a time: Tab
 *   should cycle only within each, Escape should close it and return
 *   focus to the button that opened it, and clicking the backdrop
 *   should close it too (except "Destructive dialog," which should
 *   only close via its own buttons — that's `preventDismiss`).
 * - Right-click the "Right-click this card" area for the ContextMenu;
 *   confirm arrow keys move through items and Escape closes it.
 * - Tab to the info icon for the Tooltip and confirm it appears on
 *   focus, not just hover.
 */
export function OverlayPreviewPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [destructiveOpen, setDestructiveOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={200}>
      <AppShell
        topbar={
          <div className="px-6 py-3 flex items-center justify-between">
            <span className="font-semibold text-text-primary">Overlay Components Preview</span>
            <StatusBadge label="Phase 5" tone="info" />
          </div>
        }
      >
        <Page>
          <PageHeader
            title="Overlay Components Preview"
            description="Phase 5 exit-criteria page — Dialog, Drawer, BottomSheet, Popover, DropdownMenu, ContextMenu, Tooltip, and Toast."
          />

          <Section title="Dialog (replaces Modal)">
            <Card>
              <Stack direction="row" gap="sm">
                <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
                <Button variant="danger" onClick={() => setDestructiveOpen(true)}>
                  Open destructive dialog
                </Button>
              </Stack>
            </Card>
          </Section>

          <Section title="Drawer & BottomSheet">
            <Card>
              <Stack direction="row" gap="sm">
                <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
                  Open drawer
                </Button>
                <Button variant="secondary" onClick={() => setSheetOpen(true)}>
                  Open bottom sheet
                </Button>
              </Stack>
            </Card>
          </Section>

          <Section title="Popover, DropdownMenu, Tooltip">
            <Card>
              <Grid columns={{ base: 1, md: 3 }} gap="md">
                <Popover trigger={<Button variant="secondary">Open popover</Button>}>
                  <p className="text-sm text-text-primary font-medium mb-1">Filter by branch</p>
                  <p className="text-sm text-text-secondary">
                    Arbitrary content goes here — a form, a filter panel, anything.
                  </p>
                </Popover>

                <DropdownMenu
                  trigger={
                    <Button variant="secondary" className="!px-2" aria-label="More actions">
                      <MoreVertical className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  }
                  items={[
                    { label: 'Edit', icon: Pencil, onSelect: () => toast({ title: 'Edit selected' }) },
                    { label: 'Duplicate', icon: Copy, onSelect: () => toast({ title: 'Duplicated' }) },
                    { type: 'separator' },
                    {
                      label: 'Delete',
                      icon: Trash2,
                      danger: true,
                      onSelect: () => toast({ title: 'Deleted', tone: 'danger' }),
                    },
                  ]}
                />

                <Tooltip
                  trigger={
                    <button
                      aria-label="More info"
                      className="w-8 h-8 flex items-center justify-center rounded-md text-text-secondary hover:bg-surface-secondary"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  }
                  content="This is a tooltip — appears on hover or keyboard focus."
                />
              </Grid>
            </Card>
          </Section>

          <Section title="ContextMenu">
            <ContextMenu
              items={[
                { label: 'Edit', icon: Pencil, onSelect: () => toast({ title: 'Edit selected' }) },
                { label: 'Duplicate', icon: Copy, onSelect: () => toast({ title: 'Duplicated' }) },
                { type: 'separator' },
                {
                  label: 'Delete',
                  icon: Trash2,
                  danger: true,
                  onSelect: () => toast({ title: 'Deleted', tone: 'danger' }),
                },
              ]}
            >
              <Card padding="lg" className="border-dashed">
                <p className="text-sm text-text-secondary text-center">
                  Right-click this card to open a context menu.
                </p>
              </Card>
            </ContextMenu>
          </Section>

          <Section title="Toast">
            <Card>
              <Stack direction="row" gap="sm">
                <Button onClick={() => toast({ title: 'Saved', description: 'Your changes were saved.', tone: 'success' })}>
                  Trigger success toast
                </Button>
                <Button
                  variant="danger"
                  onClick={() =>
                    toast({ title: 'Something went wrong', description: 'Please try again.', tone: 'danger' })
                  }
                >
                  Trigger error toast
                </Button>
              </Stack>
            </Card>
          </Section>
        </Page>
      </AppShell>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Edit branch">
        <p className="text-sm text-text-secondary">
          Ordinary dialog content — closes on Escape, outside click, or the ✕ button.
        </p>
      </Dialog>

      <Dialog
        open={destructiveOpen}
        onClose={() => setDestructiveOpen(false)}
        title="Delete branch?"
        preventDismiss
        footer={
          <>
            <Button variant="secondary" onClick={() => setDestructiveOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setDestructiveOpen(false);
                toast({ title: 'Branch deleted', tone: 'danger' });
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          This can't be undone. Escape and outside-click are disabled here on purpose
          (`preventDismiss`) — only the buttons below or the ✕ close this.
        </p>
      </Dialog>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Branch details">
        <p className="text-sm text-text-secondary">Side-panel content, e.g. a detail view.</p>
      </Drawer>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Quick actions">
        <p className="text-sm text-text-secondary">
          Mobile-oriented sheet — Waiter App's primary overlay pattern per the plan.
        </p>
      </BottomSheet>

      <Toaster />
    </TooltipProvider>
  );
}
