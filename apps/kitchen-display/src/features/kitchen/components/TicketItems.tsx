import type { KitchenTicket } from '@pos/types';

interface Props {
  notes: KitchenTicket['notes'];
  items: KitchenTicket['items'];
}

// **Flagged, considered choice — different call than `constants.ts`'s
// per-status badges:** the original used three amber shades here
// (`amber-300` for notes/variant text, `amber-400` for the quantity
// badge, `amber-500/10` for the notes background) as one accent
// family's brightness levels, not a multi-hue semantic distinction the
// way `STATUS_CONFIG`'s FIRED/PREPARING/READY badges are. Consolidated
// onto the single `--warning` token (amber-500) + `--warning-surface`
// (amber-500/15%, close to the original's amber-500/10%) rather than
// preserved shade-by-shade — there's no separate ticket-level status
// being distinguished here, just one accent color used throughout a
// single ticket's body, so the token's one shade covers it without the
// legibility argument `constants.ts`'s badges needed.
export function TicketItems({ notes, items }: Props) {
  return (
    <>
      {/* Ticket-level notes — scoped to just this round */}
      {notes && (
        <p className="text-xs text-warning bg-warning-surface rounded-md px-2 py-1.5">📝 {notes}</p>
      )}

      <div className="space-y-1.5 flex-1">
        {items?.map((item) => (
          <div key={item.id} className="flex items-start gap-2">
            <span className="text-warning font-bold text-sm min-w-[1.5rem]">
              {item.quantity}×
            </span>
            <div>
              <p className="text-text-primary text-sm font-medium">
                {item.menuItemName}
                {item.variantName && <span className="text-warning"> · {item.variantName}</span>}
              </p>
              {item.chefNotes && (
                <p className="text-xs text-warning mt-0.5">📝 {item.chefNotes}</p>
              )}
              {item.modifiers?.map((m, i) => (
                <p key={i} className="text-xs text-text-secondary">
                  + {m.name}{m.quantity > 1 ? ` ×${m.quantity}` : ''}
                  {m.modifierGroupName ? <span className="text-text-disabled"> ({m.modifierGroupName})</span> : null}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
