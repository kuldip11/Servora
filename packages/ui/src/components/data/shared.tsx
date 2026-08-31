import {
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useState,
} from "react";

/**
 * Shared foundation for Phase 7 — Data Components
 * (the design-system contract). This phase ships in two parts (see
 * the design-system guidance "Phase 7 detail" for the split
 * rationale): Part 1 is `Table`/`Pagination`/`FilterBar`/`Toolbar`/
 * `SkeletonLoader`/upgraded `EmptyState`. Part 2 is `DataGrid`
 * (virtualization, bulk select, sticky columns, column visibility) plus
 * the Admin Orders migration this phase's exit criterion requires.
 *
 * `Column<T>` is intentionally shaped so `DataGrid` (Part 2) can reuse
 * it rather than inventing a second column type — `DataGrid`'s extra
 * concerns (visibility, sticky side) are additive fields, not a
 * different shape. See the `hidden`/`sticky` fields below, unused by
 * `Table` but now consumed by `DataGrid`.
 *
 * Part 2 (`DataGrid` itself, plus the row-virtualization/sticky-offset/
 * global-filter helpers below) lives in this same file rather than a
 * second `shared2.tsx` — see the "DataGrid (Part 2) additions" section
 * further down.
 */

export type SortDirection = "asc" | "desc";

export interface SortState {
  columnId: string;
  direction: SortDirection;
}

export type ColumnAlign = "left" | "right" | "center";

export interface Column<T> {
  /** Must be stable and unique — used as the React key and as `sort.columnId`. */
  id: string;
  header: ReactNode;
  /** Renders one cell. Receives the row and its index in the *currently displayed* order. */
  cell: (row: T, rowIndex: number) => ReactNode;
  /** Omit to make the column unsortable even if the table as a whole supports sorting. */
  sortable?: boolean | undefined;
  /**
   * Returns the comparable value for this row. Required for client-side sorting
   * (see `sortRows` below) — a `sortable` column with no `sortValue` will toggle
   * `sort` state via `onSortChange` but `Table` won't reorder rows itself, which
   * is the right shape for server-side sorting (caller re-fetches in the new order).
   */
  sortValue?: ((row: T) => string | number | Date) | undefined;
  align?: ColumnAlign | undefined;
  width?: string | undefined;
  minWidth?: string | undefined;
  /** Reserved for `DataGrid` (Part 2)'s column-visibility toggle. Unused by `Table`. */
  hidden?: boolean | undefined;
  /** Reserved for `DataGrid` (Part 2)'s sticky columns. Unused by `Table`. */
  sticky?: "left" | "right" | undefined;
}

export const ALIGN_CLASSES: Record<ColumnAlign, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export type TableDensity = "compact" | "comfortable";

export const CELL_PADDING: Record<TableDensity, string> = {
  compact: "px-3 py-2",
  comfortable: "px-4 py-3",
};

/**
 * Phase 9 (Accessibility Hardening) fix. Both `Table` and `DataGrid` had a
 * real gap: the sortable-column `<button>` in each header cell rendered with
 * no focus styling at all (`grep -c "focus:"` on both files was 0/2 before
 * this pass — `DataGrid`'s only two `focus:` hits were on its filter input
 * and the row-selection checkbox, not the sort button). Keyboard users could
 * still *tab to and activate* the button — it's a real `<button>`, nothing
 * was un-focusable — but had no visible indicator that it was focused.
 * `focus-visible:` (not bare `focus:`) so a mouse click doesn't paint a ring
 * that a keyboard `Tab` should own instead.
 */
export const SORT_BUTTON_FOCUS_CLASSES =
  "rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1";

/**
 * Phase 9 fix, same audit pass as `SORT_BUTTON_FOCUS_CLASSES` above: a
 * clickable `<tr onClick>` (both `Table`'s `onRowClick` and `DataGrid`'s)
 * had **no keyboard equivalent at all** — a `<tr>` isn't natively focusable
 * or actionable, so `onClick` alone made the row a mouse-only, sighted-
 * pointer-only interaction. That's the real finding here, not just a
 * missing ring.
 *
 * Fix: `tabIndex={0}` makes the row reachable via `Tab`, this keydown
 * handler makes `Enter`/`Space` activate it (the two keys native
 * interactive elements respond to), and `focus-visible:` gives it a ring.
 *
 * Deliberately **not** `role="button"` on the `<tr>`: overriding a table
 * row's implicit `row` role would drop its cells' association with their
 * `<th scope="col">` headers for screen-reader users navigating the table
 * structure (e.g. NVDA/VoiceOver's "column X" announcements), trading one
 * a11y gap for a worse one. A `<tr>` that's independently focusable and
 * Enter/Space-activatable while keeping its native row semantics is the
 * same pattern MUI's DataGrid and most accessible data-table
 * implementations use for "clickable row" — the row is reachable and
 * operable, just not re-announced as a different element type. Only
 * unresolved caveat: a real screen-reader pass (VoiceOver/NVDA) to confirm
 * this reads sensibly in practice hasn't happened in this pass — no
 * browser/network available in this environment, same standing caveat
 * every phase since Phase 4 has carried (see README "Phase 8 detail").
 */
export const CLICKABLE_ROW_FOCUS_CLASSES =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary";

export function clickableRowKeyDown<T>(
  row: T,
  onRowClick: ((row: T) => void) | undefined,
) {
  if (!onRowClick) return undefined;
  return (e: KeyboardEvent<HTMLTableRowElement>) => {
    if (e.target !== e.currentTarget) return; // don't fire if a focusable child (e.g. a cell button) handled it
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowClick(row);
    }
  };
}

/**
 * Client-side sort. No-ops (returns `rows` as-is) when `sort` is `null` or when
 * the sorted column has no `sortValue` — see `Column.sortValue`'s doc comment for
 * why that's the correct behavior for server-side-sorted tables rather than a bug.
 * Stable: ties keep their original relative order (uses `Array.prototype.sort`'s
 * spec-guaranteed stability, not a manual tiebreaker).
 */
export function sortRows<T>(
  rows: T[],
  columns: Column<T>[],
  sort: SortState | null | undefined,
): T[] {
  if (!sort) return rows;
  const col = columns.find((c) => c.id === sort.columnId);
  if (!col?.sortValue) return rows;
  const getValue = col.sortValue;
  const dir = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = getValue(a);
    const bv = getValue(b);
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
}

/** Cycles a column's sort through none → asc → desc → none, the same 3-state
 * pattern used by most data-grid UIs (lets a user clear a sort, not just flip it). */
export function nextSortState(
  current: SortState | null,
  columnId: string,
): SortState | null {
  if (!current || current.columnId !== columnId)
    return { columnId, direction: "asc" };
  if (current.direction === "asc") return { columnId, direction: "desc" };
  return null;
}

// --- DataGrid (Part 2) additions -------------------------------------------
// Everything below this line is new in Part 2. `Column<T>`/`sortRows`/
// `nextSortState` above are unchanged from Part 1 — `DataGrid` imports
// them as-is rather than forking a second copy.

/**
 * Row virtualization for `DataGrid`, parametrized by row height —
 * deliberately **not** a reuse of `selection/shared.tsx`'s
 * `useVirtualRows`, whose `ROW_HEIGHT` is a hardcoded 40px constant
 * tuned for single-line option rows. `DataGrid` body rows are
 * typically taller (cell padding + potential multi-element cell
 * content) and callers may want to tune density, so this takes
 * `rowHeight` as an argument instead. Deferred at the end of Phase 7
 * Part 1 (see the design-system guidance's "Next up" note) rather
 * than guessed at the time — this is that decision: a parametrized
 * sibling in this same file, not a shared generic in `selection/`,
 * since `packages/ui/src/components/selection/` and `.../data/` are
 * independent feature areas and forcing one to import the other's
 * internals would be a worse coupling than the small duplication of
 * arithmetic here (~15 lines).
 */
export function useVirtualizedRows(
  count: number,
  containerRef: RefObject<HTMLElement | null>,
  rowHeight: number,
  overscan = 8,
) {
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // Phase 14 finding: this effect had no dependency array, so it re-ran on
  // every render — including every `setScrollTop` from the scroll handler
  // it itself installs. On a large dataset that's a full listener/observer
  // teardown-and-rebuild on *every scroll frame*, exactly the per-frame
  // cost virtualization exists to avoid, and it undercuts Phase 7's own
  // "scrolls smoothly on largest real datasets" exit criterion.
  // `containerRef.current` is intentionally the dependency (not the usual
  // empty array) — the scroll container only exists once `loading`/`empty`
  // gives way to real rows, so the effect must still re-run the one time
  // `el` actually appears, just not on every scroll-driven re-render after.
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

  const totalHeight = count * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(
    count,
    Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan,
  );

  return { totalHeight, startIndex, endIndex, offsetY: startIndex * rowHeight };
}

/** Fallback width (px) used to compute sticky-column offsets when a sticky
 * column has no explicit `width`. Sticky positioning needs a real reserved
 * width to compute `left`/`right` offsets against — see `computeStickyOffsets`'s
 * doc comment for the constraint this implies on sticky columns. */
export const STICKY_FALLBACK_WIDTH = 150;

function parseWidthPx(width: string | undefined): number {
  if (!width) return STICKY_FALLBACK_WIDTH;
  const n = parseFloat(width);
  return Number.isFinite(n) && width.trim().endsWith("px")
    ? n
    : STICKY_FALLBACK_WIDTH;
}

/**
 * Computes each visible column's sticky `left`/`right` pixel offset from
 * its position among other sticky columns on the same side, so multiple
 * sticky-left (or sticky-right) columns stack correctly instead of
 * overlapping. Returns `undefined` for non-sticky columns.
 *
 * **Constraint, not a bug:** offsets are computed from each column's
 * `width` prop parsed as a literal px value (e.g. `'120px'`). A sticky
 * column with no `width`, or a `width` given in a non-px unit (`%`,
 * `rem`, `auto`), falls back to `STICKY_FALLBACK_WIDTH` (150px) for the
 * *offset math only* — its rendered width is unaffected — so the sticky
 * column's visual edge can drift from its neighbor's actual edge if the
 * real rendered width differs from the fallback. Give sticky columns an
 * explicit px `width` to avoid this; not enforced at the type level
 * because non-sticky columns have no such requirement.
 */
export function computeStickyOffsets<T>(
  visibleColumns: Column<T>[],
): Map<string, { left?: number; right?: number }> {
  const offsets = new Map<string, { left?: number; right?: number }>();
  let leftAcc = 0;
  for (const col of visibleColumns) {
    if (col.sticky === "left") {
      offsets.set(col.id, { left: leftAcc });
      leftAcc += parseWidthPx(col.width);
    }
  }
  let rightAcc = 0;
  for (let i = visibleColumns.length - 1; i >= 0; i--) {
    const col = visibleColumns[i]!;
    if (col.sticky === "right") {
      offsets.set(col.id, { right: rightAcc });
      rightAcc += parseWidthPx(col.width);
    }
  }
  return offsets;
}

/** Case-insensitive substring match over a caller-supplied per-row search
 * string. Mirrors `selection/shared.tsx`'s `filterOptions` reasoning:
 * simple substring, not fuzzy — a data table's global search is expected
 * to behave like a literal filter, not `CommandPalette`'s ranked-fuzzy
 * command search (different use case, see that component's own doc
 * comment for why fuzzy was chosen there instead). */
export function matchesGlobalFilter(
  searchableText: string,
  query: string,
): boolean {
  if (!query.trim()) return true;
  return searchableText.toLowerCase().includes(query.trim().toLowerCase());
}
