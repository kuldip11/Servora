import {
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useState,
} from "react";
import { Check } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Shared foundation for Phase 4 — Selection Components
 * (the design-system contract): `SelectMenu`, `MultiSelect`,
 * `Combobox`, `Autocomplete`.
 *
 * Build choice, resolved in the design-system guidance's Phase 1
 * "Open decisions": Radix UI, not built from scratch. Concretely, all
 * four components here sit on **`@radix-ui/react-popover`** for
 * positioning/portal/outside-click/Escape/focus-return — not on
 * `@radix-ui/react-select`. Radix's own `Select` renders its full
 * option list into the DOM up front and manages scroll/position
 * against real DOM measurements, which fights hand-rolled windowing
 * (a well-known limitation, not an oversight). Since this phase's
 * exit criteria requires a 10,000-option list to scroll smoothly,
 * every component needs windowing, so all four share one `Popover` +
 * `role="listbox"`/`role="option"` foundation — the same pattern
 * shadcn/ui's Combobox uses (Popover + Command) — instead of half
 * sitting on a primitive that resists it.
 */

export interface SelectOption {
  value: string;
  label: string;
  /** Secondary line rendered to the right of the label, e.g. an email or SKU. */
  description?: string | undefined;
  icon?: ComponentType<{ className?: string }> | undefined;
  /** e.g. an avatar `<img>` or colored dot — takes priority over `icon`. */
  media?: ReactNode | undefined;
  disabled?: boolean | undefined;
  /** Options sharing a `group` are clustered under one heading, in first-seen order. */
  group?: string | undefined;
}

export const ROW_HEIGHT = 40; // px — must match OptionRow/HeaderRow's fixed height below
const OVERSCAN = 8;

type Row =
  | { kind: "header"; key: string; label: string }
  | { kind: "option"; key: string; option: SelectOption; optionIndex: number };

/** Flattens options into a render-ready row list, inserting one header row per
 * distinct `group` (in first-seen order). Headers get the same fixed row height
 * as options so the whole list stays uniformly virtualizable — see the file-level
 * doc comment on why fixed-height windowing was chosen over a variable-height
 * virtualizer for this phase. Options with no `group` render with no header. */
export function buildRows(options: SelectOption[]): Row[] {
  const hasAnyGroup = options.some((o) => o.group);
  if (!hasAnyGroup) {
    return options.map((option, optionIndex) => ({
      kind: "option",
      key: option.value,
      option,
      optionIndex,
    }));
  }
  const rows: Row[] = [];
  const seenGroups = new Set<string | undefined>();
  options.forEach((option, optionIndex) => {
    if (!seenGroups.has(option.group)) {
      seenGroups.add(option.group);
      if (option.group) {
        rows.push({
          kind: "header",
          key: `__group_${option.group}`,
          label: option.group,
        });
      }
    }
    rows.push({ kind: "option", key: option.value, option, optionIndex });
  });
  return rows;
}

/** Row indices (into `rows`) of every selectable option row, in order —
 * what keyboard nav and typeahead should move between. */
function optionRowIndices(rows: Row[]): number[] {
  const out: number[] = [];
  rows.forEach((r, i) => {
    if (r.kind === "option") out.push(i);
  });
  return out;
}

/** Poor-man's windowing over a fixed-height row list: renders only the rows
 * within view + overscan. Avoids pulling in `@tanstack/react-virtual` for one
 * dependency's worth of arithmetic — every row here is a single fixed-height
 * line (label + optional description), never a multi-line card. */
export function useVirtualRows(
  count: number,
  containerRef: RefObject<HTMLElement | null>,
) {
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // Phase 14 finding: same bug as `data/shared.tsx`'s `useVirtualizedRows`
  // (independent copy, see this hook's own doc comment for why it's not
  // shared) — no dependency array meant the listener + `ResizeObserver`
  // were torn down and rebuilt on every scroll-driven re-render. This is
  // the hook behind Phase 4's own "10,000-option virtualized select scrolls
  // smoothly" exit criterion, so it's the highest-impact of the two copies
  // to fix. `containerRef.current` is the intentional dependency — the
  // popover's option list only mounts once open, so the effect still needs
  // to re-run the one time `el` appears, just not on every scroll after.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setScrollTop(el.scrollTop);
    setViewportHeight(el.clientHeight);
    const resizeObserver = new ResizeObserver(() =>
      setViewportHeight(el.clientHeight),
    );
    resizeObserver.observe(el);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();
    };
  }, [containerRef.current]);

  const totalHeight = count * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    count,
    Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN,
  );

  return {
    totalHeight,
    startIndex,
    endIndex,
    offsetY: startIndex * ROW_HEIGHT,
  };
}

/** Case-insensitive substring filter shared by Combobox/Autocomplete/MultiSelect's search box. */
export function filterOptions(
  options: SelectOption[],
  query: string,
): SelectOption[] {
  if (!query.trim()) return options;
  const q = query.trim().toLowerCase();
  return options.filter(
    (o) =>
      o.label.toLowerCase().includes(q) ||
      o.description?.toLowerCase().includes(q),
  );
}

export function rowDomId(listboxId: string, rowIndex: number) {
  return `${listboxId}-row-${rowIndex}`;
}

export const popoverContentClasses = cn(
  "z-50 overflow-hidden rounded-md border border-border bg-surface shadow-dropdown",
);

export const triggerBaseClasses = cn(
  "flex w-full items-center justify-between gap-2 text-left text-sm text-text-primary bg-surface border rounded-md",
  "px-3 py-2.5 transition-colors duration-fast ease-standard",
  "focus:outline-none focus:ring-2 focus:border-transparent",
  "disabled:bg-surface-secondary disabled:text-text-disabled disabled:cursor-not-allowed",
);

function HeaderRow({ label }: { label: string }) {
  return (
    <li
      role="presentation"
      style={{ height: ROW_HEIGHT }}
      className="flex items-end pb-1 px-3 text-xs font-semibold text-text-secondary uppercase tracking-wide"
    >
      {label}
    </li>
  );
}

/** One virtualized option row. Shared by SelectMenu/Combobox/Autocomplete (single-select,
 * checkmark-on-right) and MultiSelect (checkbox-on-left via the `leading` slot). */
function OptionRow({
  option,
  selected,
  active,
  domId,
  onClick,
  leading,
}: {
  option: SelectOption;
  selected: boolean;
  active: boolean;
  domId: string;
  onClick: () => void;
  leading?: ReactNode;
}) {
  const Icon = option.icon;
  return (
    // Same reasoning as CommandPalette's CommandRow: this row is a
    // listbox `option` that's never itself DOM-focused. Keyboard
    // selection is driven from the owning input's `onKeyDown`
    // (ArrowUp/Down move `aria-activedescendant`, Enter selects) —
    // `onClick` below is the pointer-only affordance.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <li
      id={domId}
      role="option"
      aria-selected={selected}
      aria-disabled={option.disabled || undefined}
      onClick={() => !option.disabled && onClick()}
      style={{ height: ROW_HEIGHT }}
      className={cn(
        "flex items-center gap-2 px-3 text-sm cursor-pointer select-none",
        option.disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        !option.disabled && active && "bg-surface-secondary",
        !option.disabled && !active && "hover:bg-surface-secondary",
      )}
    >
      {leading}
      {!leading && option.media}
      {!leading && !option.media && Icon && (
        <Icon className="w-4 h-4 text-text-secondary shrink-0" />
      )}
      <span className="flex-1 min-w-0 truncate text-text-primary">
        {option.label}
      </span>
      {option.description && (
        <span className="text-xs text-text-secondary truncate shrink-0 max-w-[40%]">
          {option.description}
        </span>
      )}
      {!leading && selected && (
        <Check className="w-4 h-4 text-primary shrink-0" />
      )}
    </li>
  );
}

/**
 * Renders the virtualized `<ul role="listbox">` body shared by all four
 * components. `isSelected`/`renderLeading` let `MultiSelect` swap in a
 * checkbox and multi-value selection without duplicating the windowing math.
 *
 * Purely presentational: it owns no DOM focus and no `keydown` listener.
 * Per the WAI-ARIA 1.2 combobox pattern, focus stays on whichever element
 * triggers the popup — a button for `SelectMenu`, a text input for
 * `Combobox`/`Autocomplete`/`MultiSelect` — and *that* element carries
 * `role="combobox"`, `aria-controls={listboxId}`, `aria-activedescendant`,
 * and the `onKeyDown` handler (see `useActiveRow`/`useTypeaheadBuffer`
 * above). This list only needs `id`/`role` so `aria-controls` can point at it.
 */
export function VirtualListbox({
  rows,
  listboxId,
  listRef,
  activeRowIndex,
  maxHeight,
  isSelected,
  onCommitRow,
  renderLeading,
  emptyMessage = "No options",
  multiselectable = false,
}: {
  rows: Row[];
  listboxId: string;
  listRef: RefObject<HTMLUListElement | null>;
  activeRowIndex: number;
  maxHeight: number;
  isSelected: (option: SelectOption) => boolean;
  onCommitRow: (rowIndex: number) => void;
  renderLeading?:
    ((option: SelectOption, selected: boolean) => ReactNode) | undefined;
  emptyMessage?: string | undefined;
  /** Set `aria-multiselectable` — pass true for `MultiSelect`. */
  multiselectable?: boolean | undefined;
}) {
  const { totalHeight, startIndex, endIndex, offsetY } = useVirtualRows(
    rows.length,
    listRef,
  );
  const visible = rows.slice(startIndex, endIndex);

  return (
    <ul
      ref={listRef}
      id={listboxId}
      role="listbox"
      aria-multiselectable={multiselectable || undefined}
      style={{ maxHeight, overflowY: "auto" }}
      className="relative outline-none py-1"
    >
      {rows.length === 0 ? (
        <li className="px-3 py-6 text-sm text-center text-text-secondary">
          {emptyMessage}
        </li>
      ) : (
        <div style={{ height: totalHeight, position: "relative" }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visible.map((row, i) => {
              const rowIndex = startIndex + i;
              if (row.kind === "header")
                return <HeaderRow key={row.key} label={row.label} />;
              const selected = isSelected(row.option);
              return (
                <OptionRow
                  key={row.key}
                  option={row.option}
                  selected={selected}
                  active={rowIndex === activeRowIndex}
                  domId={rowDomId(listboxId, rowIndex)}
                  onClick={() => onCommitRow(rowIndex)}
                  leading={renderLeading?.(row.option, selected)}
                />
              );
            })}
          </div>
        </div>
      )}
    </ul>
  );
}

/**
 * Arrow-key/Home/End/Enter navigation over the *selectable* rows of a
 * `rows` list (skips headers and disabled options), reported back as a
 * row index (so callers can look up `rows[activeRowIndex]` directly).
 */
export function useActiveRow(
  rows: Row[],
  onCommit: (rowIndex: number) => void,
) {
  const selectable = optionRowIndices(rows).filter((i) => {
    const r = rows[i];
    return r?.kind === "option" && !r.option.disabled;
  });
  const [activeRowIndex, setActiveRowIndex] = useState<number>(
    selectable[0] ?? -1,
  );

  useEffect(() => {
    if (!selectable.includes(activeRowIndex))
      setActiveRowIndex(selectable[0] ?? -1);
    // re-sync whenever the filtered/virtualized row set changes shape
  }, [rows.length]);

  function move(dir: 1 | -1) {
    if (selectable.length === 0) return;
    const pos = selectable.indexOf(activeRowIndex);
    const next =
      pos === -1 ? 0 : (pos + dir + selectable.length) % selectable.length;
    setActiveRowIndex(selectable[next]!);
  }

  function onKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        move(-1);
        break;
      case "Home":
        e.preventDefault();
        if (selectable[0] !== undefined) setActiveRowIndex(selectable[0]);
        break;
      case "End": {
        e.preventDefault();
        const last = selectable.at(-1);
        if (last !== undefined) setActiveRowIndex(last);
        break;
      }
      case "Enter":
        e.preventDefault();
        if (activeRowIndex >= 0) onCommit(activeRowIndex);
        break;
      default:
        break;
    }
  }

  /** Jump to the first row whose label starts with the accumulated typed prefix. */
  function typeahead(prefix: string) {
    const match = selectable.find((i) => {
      const r = rows[i];
      return (
        r?.kind === "option" && r.option.label.toLowerCase().startsWith(prefix)
      );
    });
    if (match !== undefined) setActiveRowIndex(match);
  }

  return { activeRowIndex, setActiveRowIndex, onKeyDown, typeahead };
}

/** Accumulates printable keystrokes into a short-lived prefix for single-letter-jump
 * navigation (native `<select>` behavior) — call from a listbox's `onKeyDown`. */
export function useTypeaheadBuffer(onPrefix: (prefix: string) => void) {
  const [buffer, setBuffer] = useState("");
  useEffect(() => {
    if (!buffer) return;
    const id = setTimeout(() => setBuffer(""), 500);
    return () => clearTimeout(id);
  }, [buffer]);

  function onKeyDown(e: KeyboardEvent) {
    if (
      e.key.length !== 1 ||
      !/\S/.test(e.key) ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey
    )
      return;
    const next = buffer + e.key.toLowerCase();
    setBuffer(next);
    onPrefix(next);
  }

  return { onKeyDown };
}

/** Scrolls the active row into view within a virtualized container, without
 * requiring the row to already be mounted in the current window. */
export function useScrollActiveIntoView(
  containerRef: RefObject<HTMLElement | null>,
  activeRowIndex: number,
  open: boolean,
) {
  useEffect(() => {
    if (!open || activeRowIndex < 0) return;
    const el = containerRef.current;
    if (!el) return;
    const top = activeRowIndex * ROW_HEIGHT;
    const bottom = top + ROW_HEIGHT;
    if (top < el.scrollTop) el.scrollTop = top;
    else if (bottom > el.scrollTop + el.clientHeight)
      el.scrollTop = bottom - el.clientHeight;
  }, [activeRowIndex, open, containerRef]);
}

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export type { Row };
