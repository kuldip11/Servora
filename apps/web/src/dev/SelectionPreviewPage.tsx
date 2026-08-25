import { useMemo, useState } from "react";
import {
  AppShell,
  Page,
  PageHeader,
  Section,
  Card,
  Stack,
  Grid,
  StatusBadge,
  SelectMenu,
  MultiSelect,
  Combobox,
  Autocomplete,
  type SelectOption,
} from "@pos/ui";
import { Store, User } from "lucide-react";

/**
 * Internal-only route (`/dev/selection-preview`, no auth guard). Phase 4
 * exit criteria (docs/design-system/00-PLAN.md): a 10,000-option
 * virtualized select scrolls smoothly, and every component passes a
 * keyboard-only pass. This page exercises all four in one place —
 * nothing hand-rolled.
 *
 * Manual checks to run against this page before calling Phase 4 done:
 * - "Branch (10,000 options)" below: open it, scroll the whole way to
 *   the bottom, and confirm it stays smooth — this is the phase's
 *   named exit criterion, not a nice-to-have.
 * - Tab through the whole page with no mouse: every trigger/input must
 *   open with Enter/ArrowDown, arrow keys must move the highlight,
 *   Enter must commit, Escape must close and restore the prior value.
 * - MultiSelect: confirm Backspace-on-empty-search removes the last
 *   chip, and that every remaining control (search input, listbox rows,
 *   "Clear all") is keyboard-reachable — the trigger's chips are a
 *   read-only summary by design, see MultiSelect.tsx's comment on why.
 * - VoiceOver/NVDA smoke test: each open listbox should be announced
 *   with its option count and the current selection.
 */
export function SelectionPreviewPage() {
  const statusOptions: SelectOption[] = [
    { value: "draft", label: "Draft" },
    { value: "active", label: "Active" },
    { value: "archived", label: "Archived", disabled: true },
  ];
  const [status, setStatus] = useState<string | undefined>("active");

  const roleOptions: SelectOption[] = [
    { value: "owner", label: "Owner", group: "Management", icon: User },
    { value: "manager", label: "Manager", group: "Management", icon: User },
    { value: "server", label: "Server", group: "Front of house", icon: User },
    { value: "host", label: "Host", group: "Front of house", icon: User },
    { value: "cook", label: "Cook", group: "Kitchen", icon: User },
    { value: "dishwasher", label: "Dishwasher", group: "Kitchen", icon: User },
  ];
  const [roles, setRoles] = useState<string[]>(["manager", "server"]);

  const cuisineOptions: SelectOption[] = [
    "Italian",
    "Japanese",
    "Mexican",
    "Thai",
    "Indian",
    "French",
    "Korean",
    "Vietnamese",
    "Mediterranean",
    "American",
  ].map((label) => ({ value: label.toLowerCase(), label }));
  const [cuisine, setCuisine] = useState<string | undefined>(undefined);

  // Phase 4's named exit criterion: this list must stay smooth at 10,000 rows.
  const bigBranchOptions: SelectOption[] = useMemo(
    () =>
      Array.from({ length: 10_000 }, (_, i) => ({
        value: `branch-${i}`,
        label: `Branch #${String(i + 1).padStart(5, "0")}`,
        description: `District ${(i % 40) + 1}`,
        icon: Store,
      })),
    [],
  );
  const [bigBranch, setBigBranch] = useState<string | undefined>(undefined);

  // Stands in for a server round-trip: Autocomplete owns only the debounce +
  // display, the caller (here) owns fetching. A real call site would swap
  // this filter for a TanStack Query request keyed on the query string.
  const staffDirectory: SelectOption[] = [
    { value: "s1", label: "Amina Chen", description: "amina@restaurant.test" },
    {
      value: "s2",
      label: "Diego Alvarez",
      description: "diego@restaurant.test",
    },
    { value: "s3", label: "Priya Nair", description: "priya@restaurant.test" },
    {
      value: "s4",
      label: "Tomasz Nowak",
      description: "tomasz@restaurant.test",
    },
  ];
  const [staffQuery, setStaffQuery] = useState("");
  const [staffResults, setStaffResults] = useState<SelectOption[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staff, setStaff] = useState<SelectOption | undefined>(undefined);

  const handleStaffSearch = (query: string) => {
    setStaffQuery(query);
    setStaffLoading(true);
    // Simulated latency so the loading state is actually visible to click through.
    window.setTimeout(() => {
      setStaffResults(
        staffDirectory.filter((o) =>
          o.label.toLowerCase().includes(query.toLowerCase()),
        ),
      );
      setStaffLoading(false);
    }, 400);
  };

  return (
    <AppShell
      topbar={
        <div className="px-6 py-3 flex items-center justify-between">
          <span className="font-semibold text-text-primary">
            Selection Components Preview
          </span>
          <StatusBadge label="Phase 4" tone="info" />
        </div>
      }
    >
      <Page>
        <PageHeader
          title="Selection Components Preview"
          description="Phase 4 exit-criteria page — SelectMenu, MultiSelect, Combobox, and Autocomplete, including a 10,000-option virtualized list."
        />

        <Section title="SelectMenu — single-select, grouped, no free text">
          <Card>
            <Stack gap="md">
              <Grid columns={{ base: 1, md: 2 }} gap="md">
                <SelectMenu
                  label="Status"
                  options={statusOptions}
                  value={status}
                  onChange={setStatus}
                  hint="One archived option is disabled to check that arrow-key nav skips it."
                />
                <SelectMenu
                  label="Default role"
                  options={roleOptions}
                  value={undefined}
                  onChange={() => {}}
                  placeholder="Choose a role…"
                />
              </Grid>
            </Stack>
          </Card>
        </Section>

        <Section title="MultiSelect — searchable, checkboxes, grouped">
          <Card>
            <MultiSelect
              label="Assigned roles"
              options={roleOptions}
              value={roles}
              onChange={setRoles}
              hint="Trigger chips are a read-only summary — remove via the listbox or Clear all (see MultiSelect.tsx)."
            />
          </Card>
        </Section>

        <Section title="Combobox — client-side text filter">
          <Card>
            <Grid columns={{ base: 1, md: 2 }} gap="md">
              <Combobox
                label="Cuisine"
                options={cuisineOptions}
                value={cuisine}
                onChange={setCuisine}
              />
              <SelectMenu
                label="Branch (10,000 options)"
                options={bigBranchOptions}
                value={bigBranch}
                onChange={setBigBranch}
                hint="Phase 4 exit criterion — scroll this to the bottom and confirm it stays smooth."
              />
            </Grid>
          </Card>
        </Section>

        <Section title="Autocomplete — async/debounced search">
          <Card>
            <Stack gap="sm">
              <Autocomplete
                label="Staff member"
                value={staff}
                onChange={setStaff}
                options={staffResults}
                onSearch={handleStaffSearch}
                loading={staffLoading}
                placeholder="Search staff by name…"
                hint="Simulates a 400ms server round-trip on every debounced keystroke."
              />
              {staffQuery && (
                <p className="text-xs text-text-secondary">
                  Last search sent to "the server": "{staffQuery}"
                </p>
              )}
            </Stack>
          </Card>
        </Section>
      </Page>
    </AppShell>
  );
}
