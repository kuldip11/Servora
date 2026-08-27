import type { KitchenTicketStatus } from "@pos/types";
import type { StatusTone } from "@pos/ui";

// Design-system Phase 12, Sprint KDS-1: colors retokenized onto
// `--info`/`--warning`/`--success` (dark theme values were pulled 1:1
// from this exact palette — `tokens.css`'s own top comment says so —
// so `blue-500`→`info`, `amber-500`→`warning`, `emerald-500`→`success`
// are exact matches, not approximations, for the *background* uses
// below (`border`, and the `btn` base color for FIRED/PREPARING).
//
// Design-system Phase 13, Sprint KDS-3: `badge` (a raw `bg-*/20
// text-*-400` class string) is now `badgeTone` — this ticket status
// badge moved onto the shared `StatusBadge` primitive (Phase 3) in
// `TicketHeader.tsx`, closing out the last of the audit's "3
// independent status-badge implementations" (Admin's menu status and
// Waiter App's order status were already on it; this was the one
// still tracked under Phase 12). **The legibility-tuned text shade is
// still flagged, not dropped:** `badgeTextClass` carries the same
// deliberate `-400`-over-`-500` override this file's Sprint KDS-1
// comment already explained (`StatusBadge`'s own `TONE_CLASSES` use
// `text-{tone}`, the `-500` background-tuned token, not body-text-safe
// on near-black) — passed as a `className` override on the primitive
// rather than accepted as-is, same reasoning as before, just now
// wired through the shared component instead of a bespoke `<span>`.
//
// `btn`'s hardcoded `text-white` is gone — every status here shares
// `--warning`/`--info` with a light-ink foreground of `#111827`
// (`tokens.css`'s own Phase 9 comment: this is literally the finding
// that pass, white-on-amber-500 in dark theme is 2.15:1, nowhere near
// AA — that exact bug existed here too, since `KitchenBoard`/
// `TicketFooter` were never touched by Phase 9's original hardening
// pass). `hover:opacity-90` replaces the old one-shade-lighter hover
// (`blue-600→500`, `amber-500→400`) — the same technique `Button`'s
// own `danger`/`success` variants use for tonal hover, since there's
// no `--info-hover`/`--warning-hover` token to reach for (only
// `--primary-hover` exists).
export const STATUS_CONFIG = {
  PENDING_PAYMENT: {
    label: "Awaiting Payment",
    next: null,
    nextLabel: null,
    border: "border-warning/40",
    badgeTone: "warning" as StatusTone,
    badgeTextClass: "text-amber-400",
    btn: "",
  },
  FIRED: {
    label: "Waiting",
    next: "PREPARING",
    nextLabel: "Start Cooking",
    border: "border-info/40",
    badgeTone: "info" as StatusTone,
    badgeTextClass: "text-blue-400",
    btn: "bg-info hover:opacity-90 text-info-foreground",
  },
  PREPARING: {
    label: "Cooking",
    next: "READY",
    nextLabel: "Mark Ready",
    border: "border-warning/40",
    badgeTone: "warning" as StatusTone,
    badgeTextClass: "text-amber-400",
    btn: "bg-warning hover:opacity-90 text-warning-foreground",
  },
  READY: {
    // Chef's job ends here — serving is the waiter's action, not the kitchen's.
    label: "Ready",
    next: null,
    nextLabel: null,
    border: "border-success/40",
    badgeTone: "success" as StatusTone,
    badgeTextClass: "text-emerald-400",
    btn: "",
  },
} as const satisfies Partial<Record<KitchenTicketStatus, unknown>>;

export const URGENT_THRESHOLD_MS = 15 * 60 * 1000;
export const TICKETS_POLL_INTERVAL_MS = 20_000;

// `color` kept as literal `text-*-400` for the same legibility reason
// as `badgeTextClass` above — these label the board's column headers,
// not a background chip, so the lighter shade is the deliberate
// choice here too.
export const BOARD_COLUMNS: Array<{
  title: string;
  status: KitchenTicketStatus;
  color: string;
}> = [
  { title: "New Tickets", status: "FIRED", color: "text-blue-400" },
  { title: "In Prep", status: "PREPARING", color: "text-amber-400" },
  { title: "Ready", status: "READY", color: "text-emerald-400" },
];
