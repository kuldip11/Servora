import type { KitchenTicketStatus } from "@pos/types";

interface Props {
  next: KitchenTicketStatus | null;
  nextLabel: string | null;
  btnClass: string;
  isUpdating: boolean;
  onAdvance: () => void;
}

// Design-system Phase 12, Sprint KDS-1: `text-white` dropped from the
// shared class string — `btnClass` (from `STATUS_CONFIG.btn`,
// `constants.ts`) now supplies its own foreground token
// (`text-info-foreground`/`text-warning-foreground`) per status, since
// a single hardcoded `text-white` was the exact Phase-9-documented
// dark-theme contrast failure (white on amber-500 is 2.15:1) that this
// button was never checked against before.
export function TicketFooter({
  next,
  nextLabel,
  btnClass,
  isUpdating,
  onAdvance,
}: Props) {
  if (!next) {
    return (
      <p className="text-center text-xs text-text-secondary py-2">
        Waiting for waiter to serve
      </p>
    );
  }

  return (
    <button
      onClick={onAdvance}
      disabled={isUpdating}
      className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 ${btnClass}`}
    >
      {nextLabel}
    </button>
  );
}
