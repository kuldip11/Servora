import { useState } from "react";
import {
  AppShell,
  Page,
  PageHeader,
  Section,
  Card,
  Stack,
  Grid,
  StatusBadge,
  Sidebar,
  TopNav,
  BottomNav,
  Breadcrumbs,
  Tabs,
  Accordion,
  UserMenu,
  CommandPalette,
  useCommandPaletteHotkey,
  toast,
  Toaster,
} from "@pos/ui";
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Table2,
  Boxes,
  Users,
  Settings,
  Home,
  Receipt,
  User,
  LogOut,
  CreditCard,
} from "lucide-react";

/**
 * Internal-only route (`/dev/navigation-preview`, no auth guard). Phase
 * 6 exit criterion (docs/design-system/00-PLAN.md): "Cmd+K opens from
 * anywhere, fuzzy-searches a registered command list, fully
 * keyboard-operable." Every nav component below is a Phase 6 component.
 *
 * Manual checks to run against this page before calling Phase 6 done:
 * - Press Cmd+K (Mac) / Ctrl+K (Windows/Linux) anywhere on this page —
 *   the command palette should open without clicking anything first.
 *   Type "bran" and confirm "Branches" still matches (fuzzy, not exact
 *   substring), then arrow-key through results and press Enter.
 * - Click the "Collapse" control at the bottom of the sidebar; confirm
 *   labels hide and each icon now shows a tooltip on hover/focus.
 * - Tab through the Tabs control with arrow keys (not just Tab) and
 *   confirm selection follows focus. Same for the Accordion — Enter/
 *   Space toggles a section, and only one section stays open at a time.
 */
export function NavigationPreviewPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { open: paletteOpen, setOpen: setPaletteOpen } =
    useCommandPaletteHotkey();

  const commands = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      group: "Navigation",
      onSelect: () => toast({ title: "Navigating to Dashboard" }),
    },
    {
      id: "orders",
      label: "Orders",
      icon: ClipboardList,
      group: "Navigation",
      onSelect: () => toast({ title: "Navigating to Orders" }),
    },
    {
      id: "branches",
      label: "Branches",
      icon: Table2,
      group: "Navigation",
      keywords: "locations sites",
      onSelect: () => toast({ title: "Navigating to Branches" }),
    },
    {
      id: "new-order",
      label: "Create new order",
      icon: Receipt,
      group: "Actions",
      shortcut: "⌘N",
      onSelect: () => toast({ title: "Creating a new order" }),
    },
    {
      id: "invite-staff",
      label: "Invite staff member",
      icon: Users,
      group: "Actions",
      onSelect: () => toast({ title: "Opening invite dialog" }),
    },
  ];

  const sidebarSections = [
    {
      items: [
        {
          label: "Dashboard",
          icon: LayoutDashboard,
          active: true,
          onClick: () => {},
        },
        {
          label: "Orders",
          icon: ClipboardList,
          badge: <StatusBadge label="12" tone="info" dot={false} />,
          onClick: () => {},
        },
        { label: "Menu", icon: UtensilsCrossed, onClick: () => {} },
        { label: "Tables", icon: Table2, onClick: () => {} },
      ],
    },
    {
      title: "Manage",
      items: [
        { label: "Inventory", icon: Boxes, onClick: () => {} },
        { label: "Staff", icon: Users, onClick: () => {} },
        { label: "Settings", icon: Settings, onClick: () => {} },
      ],
    },
  ];

  const bottomNavItems = [
    { label: "Home", icon: Home, active: true, onClick: () => {} },
    { label: "Orders", icon: ClipboardList, onClick: () => {} },
    { label: "Menu", icon: UtensilsCrossed, onClick: () => {} },
    { label: "Tables", icon: Table2, onClick: () => {} },
  ];

  return (
    <>
      <AppShell
        sidebar={
          <Sidebar
            header={
              <span className="font-bold text-text-primary text-lg px-1">
                POS Admin
              </span>
            }
            sections={sidebarSections}
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
            footer={
              <UserMenu
                name="Amara Okafor"
                detail="Branch manager"
                showDetails={!sidebarCollapsed}
                align="start"
                items={[
                  {
                    label: "Profile",
                    icon: User,
                    onSelect: () => toast({ title: "Opening profile" }),
                  },
                  {
                    label: "Billing",
                    icon: CreditCard,
                    onSelect: () => toast({ title: "Opening billing" }),
                  },
                  { type: "separator" },
                  {
                    label: "Sign out",
                    icon: LogOut,
                    danger: true,
                    onSelect: () =>
                      toast({ title: "Signed out", tone: "danger" }),
                  },
                ]}
              />
            }
          />
        }
        topbar={
          <TopNav
            brand={
              <span className="font-semibold text-text-primary md:hidden">
                POS Admin
              </span>
            }
            actions={<StatusBadge label="Phase 6" tone="info" />}
          />
        }
        bottombar={<BottomNav items={bottomNavItems} className="lg:hidden" />}
      >
        <Page>
          <PageHeader
            eyebrow={
              <Breadcrumbs
                items={[
                  { label: "Admin", href: "#" },
                  { label: "Settings", href: "#" },
                  { label: "Navigation Preview" },
                ]}
              />
            }
            title="Navigation Components Preview"
            description="Phase 6 exit-criteria page — Sidebar, TopNav, BottomNav, Breadcrumbs, Tabs, Accordion, UserMenu, and the Cmd+K Command Palette."
          />

          <Section title="Tabs">
            <Card>
              <Tabs
                defaultValue="general"
                items={[
                  {
                    value: "general",
                    label: "General",
                    content: (
                      <p className="text-sm text-text-secondary">
                        General settings content.
                      </p>
                    ),
                  },
                  {
                    value: "billing",
                    label: "Billing",
                    content: (
                      <p className="text-sm text-text-secondary">
                        Billing settings content.
                      </p>
                    ),
                  },
                  {
                    value: "notifications",
                    label: "Notifications",
                    content: (
                      <p className="text-sm text-text-secondary">
                        Notification preferences content.
                      </p>
                    ),
                  },
                  {
                    value: "disabled",
                    label: "Archived",
                    disabled: true,
                    content: null,
                  },
                ]}
              />
            </Card>
          </Section>

          <Section title="Accordion">
            <Card>
              <Accordion
                type="single"
                defaultValue="hours"
                items={[
                  {
                    value: "hours",
                    title: "Operating hours",
                    content: "Mon–Sun, 9am–11pm.",
                  },
                  {
                    value: "delivery",
                    title: "Delivery zones",
                    content: "Covers a 5km radius from each branch.",
                  },
                  {
                    value: "payments",
                    title: "Accepted payments",
                    content: "Cash, card, and mobile wallets.",
                  },
                ]}
              />
            </Card>
          </Section>

          <Section title="Command Palette">
            <Card>
              <Grid columns={{ base: 1 }} gap="sm">
                <p className="text-sm text-text-secondary">
                  Press{" "}
                  <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-secondary text-text-primary text-xs">
                    ⌘K
                  </kbd>{" "}
                  /{" "}
                  <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-secondary text-text-primary text-xs">
                    Ctrl K
                  </kbd>{" "}
                  anywhere on this page, or use the button below.
                </p>
                <Stack direction="row">
                  <button
                    onClick={() => setPaletteOpen(true)}
                    className="self-start px-4 py-2 rounded-md border border-border text-sm text-text-primary hover:bg-surface-secondary transition-colors"
                  >
                    Open command palette
                  </button>
                </Stack>
              </Grid>
            </Card>
          </Section>
        </Page>
      </AppShell>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        items={commands}
      />
      <Toaster />
    </>
  );
}
