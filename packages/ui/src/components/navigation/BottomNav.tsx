import { cn } from '../../utils/cn';
import { type NavItem, NavLink } from './shared';

export interface BottomNavProps {
  items: NavItem[];
  className?: string | undefined;
}

/**
 * Mobile bottom tab bar (docs/design-system/00-PLAN.md Phase 6) — the
 * Waiter App's primary navigation pattern per the plan's Phase 11 note.
 * Slots into `AppShell`'s `bottombar` prop, which already applies the
 * safe-area bottom padding — this component only lays out the tab row
 * itself.
 *
 * Unlike `Sidebar`/`TopNav`, every item always shows both icon and
 * label (no collapsed/icon-only mode) — that's the standard mobile tab
 * bar convention and there's no room to abbreviate further at this
 * size, so unlike `Sidebar` there's no `Tooltip` fallback needed here.
 *
 * **No built-in responsive hiding (Session 12, docs/accessibility):**
 * this component doesn't apply its own breakpoint — pass one via
 * `className` (e.g. the existing `NavigationPreviewPage.tsx` example
 * uses `className="lg:hidden"`) matching whatever screens should show
 * the bottom bar instead of `TopNav`'s `items`. **If used alongside a
 * `TopNav` that has `items`, that breakpoint must match `TopNav`'s
 * inner nav's `hidden md:flex` exactly (i.e. use `md:hidden` here, not
 * a different one)** — see the matching note in `TopNav.tsx` for why a
 * mismatch creates a real, ambiguous double-landmark gap at whatever
 * viewport width sits between the two breakpoints.
 */
export function BottomNav({ items, className }: BottomNavProps) {
  return (
    <nav aria-label="Primary" className={cn('flex items-stretch', className)}>
      {items.map((item) => (
        <NavLink
          key={item.label}
          item={item}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors duration-fast ease-standard outline-none',
            'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
            item.disabled && 'opacity-50 pointer-events-none',
            item.active ? 'text-primary' : 'text-text-secondary hover:text-text-primary',
          )}
        >
          <span className="relative">
            {item.icon && <item.icon className="w-5 h-5" />}
            {item.badge && (
              <span className="absolute -top-1 -right-1.5 flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </span>
          <span className="truncate max-w-[4.5rem]">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
