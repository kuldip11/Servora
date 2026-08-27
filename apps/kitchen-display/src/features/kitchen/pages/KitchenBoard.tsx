import { useCallback } from "react";
import {
  ChefHat,
  RefreshCw,
  Wifi,
  WifiOff,
  LogOut,
  CheckCircle2,
  Palette,
  Volume2,
} from "lucide-react";
import type { KitchenTicketStatus } from "@pos/types";
import {
  Grid,
  IconButton,
  Spinner,
  EmptyState,
  Popover,
  ThemeSwitcher,
} from "@pos/ui";
import { useKitchenTickets } from "../hooks/useKitchenTickets";
import { useUpdateTicketStatus } from "../hooks/useUpdateTicketStatus";
import { useKitchenRealtime } from "../hooks/useKitchenRealtime";
import { groupTicketsByStatus, isUrgent } from "../utils/ticket";
import { BOARD_COLUMNS } from "../constants";
import { TicketCard } from "../components/TicketCard";
import { useKitchenAttention } from "../hooks/useKitchenAttention";

interface Props {
  onLogout: () => void;
}

// Design-system Phase 12, Sprint KDS-1: opens Kitchen Display's
// migration. `bg-gray-950`→`bg-background`, `bg-gray-900`→`bg-surface`,
// `border-gray-800`→`border-border`/`bg-surface-secondary` are all
// exact matches, not approximations — dark theme's tokens were pulled
// 1:1 from this exact palette (`tokens.css`'s own top comment). Same
// for the header logo box: `bg-amber-500`→`bg-primary` is exact (dark
// `--primary` *is* amber-500), but its icon moves from `text-white` to
// `text-primary-foreground` (dark ink, `#111827`) — a real fix, not
// just a rename: white-on-amber-500 measures 2.15:1, the exact
// contrast failure `tokens.css`'s Phase 9 comment documents for
// `Button`/`SplitButton`/`Pagination` — this header box was never
// checked against that fix since `KitchenBoard` wasn't touched until
// now.
export function KitchenBoard({ onLogout }: Props) {
  const { data: tickets, isLoading, refetch, isFetching } = useKitchenTickets();
  const updateMutation = useUpdateTicketStatus();
  const { connected } = useKitchenRealtime();
  useKitchenAttention();

  // Phase 14 memoization-audit finding, not just a perf nit: a single
  // `useUpdateTicketStatus()` instance backs the whole board, so
  // `updateMutation.isPending` is one shared boolean — true the moment
  // *any* ticket is mid-update, regardless of which one. Passed straight
  // through as each `TicketCard`'s `isUpdating` (see that file, and
  // `TicketFooter`'s `disabled={isUpdating}`), this was disabling the
  // advance button on *every* ticket on the board whenever one cook
  // advanced any single ticket — a real, user-facing bug on a busy line
  // with multiple stations touching different tickets at once, not just
  // wasted re-renders. `useMutation` exposes `variables` (the args of the
  // in-flight call) while pending, so this scopes the flag to the one
  // ticket actually being mutated.
  const isTicketUpdating = useCallback(
    (ticketId: string) =>
      updateMutation.isPending && updateMutation.variables?.id === ticketId,
    [updateMutation.isPending, updateMutation.variables],
  );

  // Stable across renders (mutate's identity from `useMutation` doesn't
  // change) — this is what makes memoizing `TicketCard` (see that file)
  // actually pay off. Before this, an inline arrow function was created
  // fresh here on every `KitchenBoard` render (every 20s poll, every
  // `kitchen.ticket.created`/`updated` websocket event — see
  // `useKitchenRealtime`, which invalidates the whole board on any single
  // ticket's event) and handed to every `TicketCard` as a new prop each
  // time, which would have defeated `React.memo` for every card on the
  // board regardless of whether that card's own ticket had changed.
  const handleUpdateStatus = useCallback(
    (id: string, status: KitchenTicketStatus) =>
      updateMutation.mutate({ id, status }),
    [updateMutation],
  );

  const urgentCount = (tickets ?? []).filter((ticket) => isUrgent(ticket.firedAt)).length;
  const readyCount = (tickets ?? []).filter((ticket) => ticket.status === "READY").length;

  const columns = BOARD_COLUMNS.map((col) => ({
    ...col,
    tickets: groupTicketsByStatus(tickets, col.status),
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 bg-surface border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">
              Kitchen Display
            </h1>
            <p className="text-xs text-text-secondary">
              {tickets?.length ?? 0} active tickets
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* `IconButton` (Phase 3) for refresh/logout. Its default
              `ghost` variant adds a `hover:bg-surface-secondary`
              affordance neither original button had (they only
              brightened on hover, no background) — a small, standard
              addition every other `IconButton` swap in this migration
              has picked up along the way, not flagged individually
              each time. Logout's original `hover:text-red-400`
              per-instance tint has no matching prop (same accepted
              loss every small icon button in this migration has
              taken) — kept as a `className` color override instead,
              since `IconButton` has no `danger`-tinted `ghost`
              variant of its own. */}
          <IconButton
            icon={RefreshCw}
            aria-label="Refresh tickets"
            onClick={() => refetch()}
            className={isFetching ? "animate-spin" : ""}
          />
          {/* Phase 16 — KDS joins the shared theme architecture but stays
              dark-by-default for its operational UX (see
              `apps/kitchen-display/src/main.tsx`'s `ThemeProvider
              defaultTheme="dark"`). `Popover` (Phase 5) rather than an
              inline `ThemeSwitcher` here, same reasoning as everywhere
              else on this glanceable, icon-only header: an inline
              dropdown with its own visible "Theme" label would break
              the row's height/alignment the way none of its sibling
              `IconButton`s do. */}
          <Popover
            align="end"
            trigger={<IconButton icon={Palette} aria-label="Change theme" />}
          >
            <div className="w-48">
              <ThemeSwitcher label="Theme" />
            </div>
          </Popover>
          {/* `text-emerald-400` kept literal here too, same reasoning
              as `Timer.tsx`'s urgent-state red and `constants.ts`'s
              badge text — small body text on near-black, one shade
              lighter than the `--success` token by design. */}
          <div
            className={`flex items-center gap-1.5 text-xs font-medium ${connected ? "text-emerald-400" : "text-text-secondary"}`}
          >
            {connected ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            {connected ? "Live" : "Polling"}
          </div>
          <IconButton
            icon={LogOut}
            aria-label="Log out"
            onClick={onLogout}
            className="hover:text-danger"
          />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-4 py-2 text-xs">
        <span className="rounded-full bg-info-surface px-2.5 py-1 font-semibold text-info">{tickets?.length ?? 0} active</span>
        <span className={`rounded-full px-2.5 py-1 font-semibold ${urgentCount ? "bg-danger-surface text-danger" : "bg-surface-secondary text-text-secondary"}`}>{urgentCount} urgent</span>
        <span className={`rounded-full px-2.5 py-1 font-semibold ${readyCount ? "bg-success-surface text-success" : "bg-surface-secondary text-text-secondary"}`}>{readyCount} ready</span>
        <span className="ml-auto inline-flex items-center gap-1 text-text-secondary"><Volume2 className="h-3.5 w-3.5" /> New-ticket alerts enabled</span>
      </div>

      {/* `Grid` (Phase 2) — fixes the exact bug the Phase 0 audit
          flagged and `Grid`'s own doc comment calls out by name: this
          fixed `grid-cols-3` had zero responsive breakpoints. Chosen
          breakpoints are a judgment call, not a spec pulled from
          anywhere (nothing in the original code implied intended
          tablet/portrait behavior) — 1 column below `sm`, 2 from `sm:`
          (a tablet turned portrait, or a smaller kitchen screen), 3
          from `lg:` up (this board's evident target: a landscape
          tablet or wall-mounted monitor). Worth a look from whoever
          knows this restaurant's actual hardware. `gap="none"` +
          `className="gap-px"` reproduces the original's 1px hairline
          divider look (the columns' own `bg-background` showing
          through a `bg-border` gap) — `Grid`'s named `gap` scale
          (none/xs 4px/sm 8px/md 16px/lg 24px) has no 1px option, so
          this is a deliberate override via the same `className`-wins
          `twMerge` technique used throughout this migration, not an
          oversight. */}
      <Grid
        columns={{ base: 1, sm: 2, lg: 3 }}
        gap="none"
        className="flex-1 gap-px bg-border overflow-hidden"
      >
        {columns.map((col) => (
          <div
            key={col.title}
            className="bg-background flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className={`font-semibold text-sm ${col.color}`}>
                {col.title}
              </h2>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full bg-surface-secondary ${col.color}`}
              >
                {col.tickets.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner className="w-6 h-6" />
                </div>
              ) : col.tickets.length === 0 ? (
                // `EmptyState` (Phase 7) — first use in this app,
                // `size="sm"` (`py-10`) since these are narrow board
                // columns, not a full-page empty state — closer to the
                // original's tight `py-8` than the default `size="md"`
                // (`py-16`) would be. **Flagged:** its icon-in-a-circle
                // treatment and `font-semibold` title are visually
                // heavier than the original's plain, deliberately
                // quiet `text-gray-700`/`text-xs` — meant to stay out
                // of the way inside a busy 3-column board rather than
                // draw the eye. A real, intentional-looking weight
                // increase worth a look, not hidden here.
                <EmptyState icon={CheckCircle2} title="No tickets" size="sm" />
              ) : (
                col.tickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onUpdateStatus={handleUpdateStatus}
                    isUpdating={isTicketUpdating(ticket.id)}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </Grid>
    </div>
  );
}
