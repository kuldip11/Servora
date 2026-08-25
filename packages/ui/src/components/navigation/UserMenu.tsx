import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { DropdownMenu } from '../overlay/DropdownMenu';
import type { MenuEntry } from '../overlay/shared';

export interface UserMenuProps {
  name: string;
  /** e.g. an email or role, shown as a secondary line when `showDetails` is true. */
  detail?: string | undefined;
  avatarUrl?: string | undefined;
  items: MenuEntry[];
  /** Hide the name/detail text and chevron, showing only the avatar — for a collapsed `Sidebar` or a tight `TopNav`. @default true */
  showDetails?: boolean | undefined;
  align?: 'start' | 'center' | 'end' | undefined;
  className?: string | undefined;
}

/**
 * Account/profile menu (docs/design-system/00-PLAN.md Phase 6) — the
 * plan calls this out as "a natural first user of the new
 * `DropdownMenu`" (Phase 5), so it's a thin composition rather than a
 * new interaction pattern: `items` is exactly `DropdownMenu`'s
 * `MenuEntry[]` shape, unchanged.
 */
export function UserMenu({
  name,
  detail,
  avatarUrl,
  items,
  showDetails = true,
  align = 'end',
  className,
}: UserMenuProps) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <DropdownMenu
      align={align}
      items={items}
      trigger={
        <button
          type="button"
          className={cn(
            'flex items-center gap-2.5 rounded-md p-1.5 text-left outline-none transition-colors duration-fast ease-standard',
            'hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-primary',
            className,
          )}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <span className="w-8 h-8 rounded-full bg-primary-surface text-primary text-xs font-semibold flex items-center justify-center shrink-0">
              {initials}
            </span>
          )}
          {showDetails && (
            <>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-text-primary truncate max-w-[9rem]">
                  {name}
                </span>
                {detail && (
                  <span className="block text-xs text-text-secondary truncate max-w-[9rem]">
                    {detail}
                  </span>
                )}
              </span>
              <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />
            </>
          )}
        </button>
      }
    />
  );
}
