import { useState } from "react";
import {
  AppShell,
  Card,
  Container,
  Grid,
  Page,
  PageHeader,
  Section,
  SplitView,
  Stack,
  Badge,
  Button,
  StatCard,
} from "@pos/ui";
import { Users, DollarSign, ShoppingBag } from "lucide-react";

/**
 * Internal-only route (`/dev/layout-preview`, no auth guard). Phase 2
 * exit criteria (docs/design-system/00-PLAN.md): "a throwaway test page
 * assembles entirely from primitives with zero custom CSS." Every
 * className below is a Tailwind utility or a preset-mapped token class
 * (`bg-*`/`text-*`/`gap-*` from `packages/ui/tailwind-preset.js`) — no
 * app-specific CSS class or inline `<style>` block is used anywhere on
 * this page.
 */
export function LayoutPreviewPage() {
  const [selected, setSelected] = useState(1);
  const items = [1, 2, 3, 4];

  return (
    <AppShell
      topbar={
        <Container size="xl">
          <Stack
            direction="row"
            justify="between"
            align="center"
            className="py-3"
          >
            <span className="font-semibold text-text-primary">
              AppShell topbar slot
            </span>
            <Badge variant="info">demo</Badge>
          </Stack>
        </Container>
      }
    >
      <Page>
        <PageHeader
          title="Layout Primitives Preview"
          description="Phase 2 exit-criteria page — every block below is Container / Stack / Grid / Section / Card / SplitView, nothing custom."
          actions={<Button size="sm">Primary action</Button>}
        />

        <Section
          title="Grid — responsive StatCards"
          description="1 col mobile, 2 sm, 4 lg"
        >
          <Grid columns={{ base: 1, sm: 2, lg: 4 }} gap="md">
            <StatCard
              title="Orders today"
              value={128}
              icon={ShoppingBag}
              color="violet"
            />
            <StatCard
              title="Revenue"
              value="$4,382"
              icon={DollarSign}
              color="emerald"
            />
            <StatCard
              title="Active staff"
              value={12}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Avg order"
              value="$34.20"
              icon={DollarSign}
              color="amber"
            />
          </Grid>
        </Section>

        <Section title="Stack — row of Cards">
          <Stack direction="row" gap="md" wrap>
            {items.map((i) => (
              <Card key={i} padding="md" className="w-48">
                <p className="text-sm font-medium text-text-primary">
                  Card {i}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  padding=&quot;md&quot;
                </p>
              </Card>
            ))}
          </Stack>
        </Section>

        <Section title="SplitView — master/detail">
          <SplitView
            primaryWidth="240px"
            primary={
              <Stack gap="sm">
                {items.map((i) => (
                  <Card
                    key={i}
                    as="button"
                    padding="sm"
                    interactive
                    onClick={() => setSelected(i)}
                    className={
                      "text-left " +
                      (selected === i
                        ? "border-primary bg-primary-surface"
                        : "")
                    }
                  >
                    <span className="text-sm font-medium text-text-primary">
                      Item {i}
                    </span>
                  </Card>
                ))}
              </Stack>
            }
            secondary={
              <Card>
                <h3 className="text-base font-semibold text-text-primary mb-2">
                  Detail for item {selected}
                </h3>
                <p className="text-sm text-text-secondary">
                  The primary pane is a fixed 240px on `lg:` and up, and stacks
                  above this pane on narrow screens.
                </p>
              </Card>
            }
          />
        </Section>
      </Page>
    </AppShell>
  );
}
