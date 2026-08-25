import { type ComponentType, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { Search } from 'lucide-react';
import { cn } from '../../utils/cn';
import { overlayScrimClasses } from '../overlay/shared';

export interface CommandItem {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }> | undefined;
  /** Cluster heading, e.g. "Navigation" / "Actions". Only shown while the query is empty — see file doc comment. */
  group?: string | undefined;
  /** Right-aligned hint text, e.g. a keyboard shortcut. Display only. */
  shortcut?: string | undefined;
  /** Extra text matched against the query but never displayed — e.g. aliases ("bill" for "Billing"). */
  keywords?: string | undefined;
  onSelect: () => void;
  disabled?: boolean | undefined;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  placeholder?: string | undefined;
  emptyMessage?: string | undefined;
}

/**
 * Cmd+K command palette (docs/design-system/00-PLAN.md Phase 6 exit
 * criteria: "opens from anywhere, fuzzy-searches a registered command
 * list, fully keyboard-operable"). Pair with `useCommandPaletteHotkey`
 * below to get the "opens from anywhere" part.
 *
 * Built directly on `@radix-ui/react-dialog` rather than the `Dialog`
 * component (Phase 5) — `Dialog` renders `OverlayHeader` (title row +
 * close button) and centered body padding, neither of which fits a
 * palette (search input *is* the header, results start flush beneath
 * it). Same "genuine shape difference, not a style preference" reasoning
 * `SelectMenu`/`SplitButton`'s non-merges already document elsewhere in
 * this package — reuses the primitive, not the styled wrapper.
 *
 * **Fuzzy matching, not virtualized.** Unlike Phase 4's `SelectMenu`
 * (10,000-row exit criterion), a command list is a registered set of
 * app actions/routes — realistically dozens, not thousands — so this
 * uses a plain subsequence-with-contiguity-bonus scorer (`fuzzyScore`
 * below) over the full list on every keystroke, no windowing. Matches
 * the plan's "fuzzy-searches" wording; `Combobox`/`Autocomplete`'s
 * `filterOptions` (Phase 4) is a stricter case-insensitive substring
 * match, appropriate there since it filters real data option lists,
 * not a short curated command set.
 *
 * **Grouping only applies to the empty-query state.** With no query,
 * items render clustered under their `group` heading in first-seen
 * order (same idea as `selection/shared.tsx`'s `buildRows`). Once a
 * query narrows/reorders the list by match score, results render as
 * one flat ranked list instead — regrouping a relevance-ranked list
 * would scatter each group's remaining matches non-contiguously, which
 * reads as broken rather than organized.
 */
export function CommandPalette({
  open,
  onOpenChange,
  items,
  placeholder = 'Type a command or search…',
  emptyMessage = 'No matching commands',
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  const results = useMemo(() => filterAndRankCommands(items, query), [items, query]);
  const activeCommand = results[activeIndex];

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function commit(index: number) {
    const command = results[index];
    if (!command || command.disabled) return;
    onOpenChange(false);
    command.onSelect();
  }

  function move(dir: 1 | -1) {
    if (results.length === 0) return;
    setActiveIndex((prev) => (prev + dir + results.length) % results.length);
  }

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={overlayScrimClasses} />
        <RadixDialog.Content
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          className={cn(
            'fixed left-1/2 top-24 z-50 w-full max-w-lg -translate-x-1/2',
            'bg-surface border border-border shadow-dropdown rounded-lg overflow-hidden',
          )}
        >
          <RadixDialog.Title className="sr-only">Command palette</RadixDialog.Title>
          <RadixDialog.Description className="sr-only">
            Search for a command or page and press Enter to run it.
          </RadixDialog.Description>

          <div className="flex items-center gap-2.5 px-4 border-b border-border">
            <Search className="w-4 h-4 text-text-secondary shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              role="combobox"
              aria-expanded={open}
              aria-controls="command-palette-listbox"
              aria-activedescendant={activeCommand ? `command-item-${activeCommand.id}` : undefined}
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  move(1);
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  move(-1);
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  commit(activeIndex);
                }
              }}
              className="flex-1 min-w-0 py-3.5 bg-transparent text-sm text-text-primary placeholder:text-text-secondary outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            />
          </div>

          {/* Session 10 fix: `aria-activedescendant` alone tells a screen
              reader which option is current, but says nothing when the
              *set* changes — e.g. typing narrows 12 results down to 0, or
              down to 1. Without this, a screen reader user who types a
              query that matches nothing gets silence, not "no matching
              commands" (the sighted `emptyMessage` row below is visible but
              not announced on its own). A visually-hidden `aria-live`
              region, updated every render from `results.length`, is the
              standard fix for a filtered-listbox pattern like this one —
              same problem class as `Toast`'s `aria-live` fix this session,
              different mechanism (a persistent region that changes text,
              not a transient toast). Kept separate from the visible
              `emptyMessage` `<li>` on purpose: that one only exists when
              `results.length === 0`, so it can't double as the live region
              for the "went from 0 to some" or "12 results to 3" cases. */}
          <div aria-live="polite" className="sr-only">
            {query.trim() &&
              (results.length === 0
                ? emptyMessage
                : `${results.length} result${results.length === 1 ? '' : 's'}`)}
          </div>

          <ul
            id="command-palette-listbox"
            role="listbox"
            className="max-h-80 overflow-y-auto py-1.5"
          >
            {results.length === 0 ? (
              <li className="px-4 py-6 text-sm text-center text-text-secondary">{emptyMessage}</li>
            ) : (
              renderRows(results, query, activeIndex, commit)
            )}
          </ul>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

function renderRows(
  results: CommandItem[],
  query: string,
  activeIndex: number,
  commit: (index: number) => void,
) {
  if (query.trim()) {
    return results.map((command, index) => (
      <CommandRow key={command.id} command={command} active={index === activeIndex} onClick={() => commit(index)} />
    ));
  }

  // Empty-query state: cluster by `group` in first-seen order, same idea as
  // `selection/shared.tsx`'s `buildRows` (see file doc comment above).
  const seenGroups = new Set<string | undefined>();
  const rows: ReactNode[] = [];
  results.forEach((command, index) => {
    if (!seenGroups.has(command.group)) {
      seenGroups.add(command.group);
      if (command.group) {
        rows.push(
          <li
            key={`__group_${command.group}`}
            role="presentation"
            className="px-4 pt-3 pb-1 text-xs font-semibold text-text-secondary uppercase tracking-wide"
          >
            {command.group}
          </li>,
        );
      }
    }
    rows.push(
      <CommandRow key={command.id} command={command} active={index === activeIndex} onClick={() => commit(index)} />,
    );
  });
  return rows;
}

function CommandRow({
  command,
  active,
  onClick,
}: {
  command: CommandItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = command.icon;
  return (
    // This row is never itself DOM-focused — keyboard selection goes
    // through the search `<input>` above (ArrowUp/Down move
    // `aria-activedescendant`, Enter selects; see that input's
    // `onKeyDown`). `onClick` below is the *pointer* affordance only;
    // a keyboard handler on the row itself would be unreachable dead
    // code, since a keyboard user can never focus an `<li>` here.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <li
      id={`command-item-${command.id}`}
      role="option"
      aria-selected={active}
      aria-disabled={command.disabled || undefined}
      onClick={() => !command.disabled && onClick()}
      className={cn(
        'flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer select-none',
        command.disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        active && !command.disabled && 'bg-surface-secondary',
      )}
    >
      {Icon && <Icon className="w-4 h-4 text-text-secondary shrink-0" />}
      <span className="flex-1 min-w-0 truncate text-text-primary">{command.label}</span>
      {command.shortcut && (
        <span className="text-xs text-text-secondary tracking-widest shrink-0">{command.shortcut}</span>
      )}
    </li>
  );
}

/** Case-insensitive subsequence match with a contiguous-run bonus so tighter
 * matches (substrings) outrank scattered ones — a lightweight fuzzy scorer,
 * not a full Levenshtein/edit-distance implementation, which this command-list
 * scale doesn't need. Returns `null` for no match. */
function fuzzyScore(query: string, target: string): number | null {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0;
  let score = 0;
  let run = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++;
      run++;
      score += run;
    } else {
      run = 0;
    }
  }
  return qi === q.length ? score : null;
}

/**
 * Wires the "opens from anywhere" half of this phase's exit criteria:
 * a global `keydown` listener for Cmd+K (Mac) / Ctrl+K (Windows/Linux)
 * that toggles `open`. Call once near the app root (e.g. alongside
 * `ThemeProvider` in `main.tsx`) and pass the returned state straight
 * to `CommandPalette`:
 *
 * ```tsx
 * const { open, setOpen } = useCommandPaletteHotkey();
 * <CommandPalette open={open} onOpenChange={setOpen} items={commands} />
 * ```
 *
 * Not wired into any app's real `main.tsx` in this pass — same
 * "component exists, app wiring is separate, deliberate follow-up"
 * pattern as `ThemeProvider` (Phase 1) and `TooltipProvider`/`Toaster`
 * (Phase 5), since no app has a real registered command list yet to
 * verify this against.
 */
export function useCommandPaletteHotkey() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return { open, setOpen };
}

function filterAndRankCommands(items: CommandItem[], query: string): CommandItem[] {
  const trimmed = query.trim();
  if (!trimmed) return items;
  return items
    .map((item) => ({ item, score: fuzzyScore(trimmed, `${item.label} ${item.keywords ?? ''}`) }))
    .filter((entry): entry is { item: CommandItem; score: number } => entry.score !== null)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}
