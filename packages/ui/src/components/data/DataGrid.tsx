import {
  type ComponentType,
  type ReactNode,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Columns3,
  Inbox,
  Search,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { EmptyState } from "../EmptyState";
import { Button } from "../Button";
import { Popover } from "../overlay/Popover";
import { SkeletonTable } from "./SkeletonLoader";
import { Pagination, type PaginationProps } from "./Pagination";
import {
  ALIGN_CLASSES,
  CELL_PADDING,
  CLICKABLE_ROW_FOCUS_CLASSES,
  clickableRowKeyDown,
  type Column,
  computeStickyOffsets,
  matchesGlobalFilter,
  nextSortState,
  SORT_BUTTON_FOCUS_CLASSES,
  sortRows,
  type SortState,
  type TableDensity,
  useVirtualizedRows,
} from "./shared";

export type { Column, SortState, TableDensity };

/**
 * Phase 7 (Part 2) — `DataGrid`. The virtualized, feature-complete
 * sibling to Part 1's `Table` (the design-system guidance "Phase 7
 * detail" has the split rationale): sort, bulk row selection, sticky
 * header + sticky columns, column visibility, an optional built-in
 * global search box, virtualized rows, and pass-through pagination.
 * This is the component the plan's exit criterion names directly —
 * migrating Admin's Orders table onto it (see
 * `apps/web/src/features/orders/pages/OrdersPage.tsx`) is what closes
 * Phase 7 out.
 *
 * `Table` is not superseded by this — most lists in this codebase
 * (Staff, Branches, Inventory's smaller views, `/dev/data-preview`)
 * have no virtualization or bulk-action need and should keep using the
 * simpler component. `DataGrid` is for the handful of tables where the
 * row count or the interaction surface (sort + filter + select + a
 * lot of columns) actually needs it — Orders is the plan's own example
 * of that.
 *
 * **Row virtualization requires a fixed pixel `rowHeight`** (default
 * 44) and a `maxHeight` scroll container — every row renders at
 * exactly that height, no variable-height cells. This is the same
 * fixed-height constraint `selection/shared.tsx`'s listbox windowing
 * already accepted in Phase 4 for the same reason (arithmetic that's
 * cheap enough not to need `@tanstack/react-virtual`), carried over
 * here with a parametrized height instead of Phase 4's hardcoded 40px
 * — see `useVirtualizedRows`'s doc comment in `shared.tsx`.
 */

export interface DataGridProps<T> {
  columns: Column<T>[];
  data: T[];
  /** Must return a stable, unique id — used as the row's React key and as the
   * bulk-selection set's member type. */
  getRowId: (row: T) => string;
  loading?: boolean | undefined;
  skeletonRows?: number | undefined;
  emptyIcon?: ComponentType<{ className?: string }> | undefined;
  emptyTitle?: string | undefined;
  emptyDescription?: string | undefined;
  emptyAction?: ReactNode;
  onRowClick?: ((row: T) => void) | undefined;

  /** Controlled sort. Same controlled-with-uncontrolled-fallback shape as `Table`'s. */
  sort?: SortState | null | undefined;
  onSortChange?: ((sort: SortState | null) => void) | undefined;
  defaultSort?: SortState | null | undefined;

  /** @default 'comfortable' */
  density?: TableDensity | undefined;
  /** Fixed row height in px — required for virtualization math. @default 44 */
  rowHeight?: number | undefined;
  /** Scroll container height. Required for both `stickyHeader` and virtualization
   * to have a scroll parent of their own. @default '560px' */
  maxHeight?: string | undefined;
  className?: string | undefined;

  // --- Bulk selection ---
  /** Enables the leading checkbox column. @default false */
  selectable?: boolean | undefined;
  /** Controlled selection. Pass alongside `onSelectedIdsChange`; omit both for uncontrolled. */
  selectedIds?: Set<string> | undefined;
  onSelectedIdsChange?: ((ids: Set<string>) => void) | undefined;
  defaultSelectedIds?: Set<string> | undefined;
  /** Row ids that may not be selected — rendered with a disabled checkbox
   * (e.g. a row already mid-action elsewhere). Omit if nothing is disabled. */
  disabledSelectionIds?: Set<string> | undefined;

  // --- Column visibility ---
  /** Shows a "Columns" toggle button above the grid when 2+ columns opt in via `id`.
   * @default false */
  enableColumnVisibility?: boolean | undefined;
  /** Controlled visibility map, keyed by `Column.id`. `true`/absent = visible,
   * `false` = hidden. Pass alongside `onColumnVisibilityChange`; omit both for
   * uncontrolled (grid manages its own, seeded from each column's `hidden` prop). */
  columnVisibility?: Record<string, boolean> | undefined;
  onColumnVisibilityChange?:
    ((visibility: Record<string, boolean>) => void) | undefined;

  // --- Global search ---
  /** Renders a built-in search box above the grid. Requires `getGlobalFilterValue`
   * to actually filter rows client-side — without it this is just a controlled
   * text box the caller reads via `onGlobalFilterChange` (server-side search).
   * @default false */
  enableGlobalFilter?: boolean | undefined;
  globalFilter?: string | undefined;
  onGlobalFilterChange?: ((value: string) => void) | undefined;
  /** Returns the text a row is matched against for the built-in global search.
   * Omit to leave filtering entirely to the caller (server-side search — rows
   * are trusted as already-filtered, same pattern as `Column.sortValue`'s
   * client-vs-server split). */
  getGlobalFilterValue?: ((row: T) => string) | undefined;
  globalFilterPlaceholder?: string | undefined;

  // --- Pagination pass-through ---
  /** Renders `Pagination` below the grid when provided. Same props as that
   * component — `DataGrid` doesn't paginate `data` itself either way; pass
   * already-paged `data` for server-side paging, or slice it yourself for
   * client-side paging before handing it to `DataGrid`. */
  pagination?: Omit<PaginationProps, "className"> | undefined;

  /** Rendered top-right, alongside the global-search box and the columns
   * toggle if either is enabled — e.g. bulk-action buttons that appear once
   * `selectedIds` is non-empty, or a page-level "Export" button. */
  toolbarActions?: ReactNode;
}

function SortIcon({ direction }: { direction: "asc" | "desc" | undefined }) {
  if (direction === "asc")
    return <ChevronUp aria-hidden="true" className="w-3.5 h-3.5" />;
  if (direction === "desc")
    return <ChevronDown aria-hidden="true" className="w-3.5 h-3.5" />;
  return (
    <ChevronsUpDown aria-hidden="true" className="w-3.5 h-3.5 opacity-40" />
  );
}

/** Native checkbox styled to token colors, with `indeterminate` support (not
 * expressible as a JSX prop — DOM-only — so it's set imperatively via `ref`). */
function GridCheckbox({
  checked,
  indeterminate = false,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      disabled={disabled}
      ref={(el) => {
        if (el) el.indeterminate = !checked && indeterminate;
      }}
      onChange={(e) => onChange(e.target.checked)}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "w-4 h-4 rounded border-border text-primary cursor-pointer",
        "focus:outline-none focus:ring-2 focus:ring-primary",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    />
  );
}

const CHECKBOX_COL_WIDTH = 40;

export function DataGrid<T>({
  columns,
  data,
  getRowId,
  loading = false,
  skeletonRows = 8,
  emptyIcon = Inbox,
  emptyTitle = "No data",
  emptyDescription,
  emptyAction,
  onRowClick,
  sort: sortProp,
  onSortChange,
  defaultSort = null,
  density = "comfortable",
  rowHeight = 44,
  maxHeight = "560px",
  className,
  selectable = false,
  selectedIds: selectedIdsProp,
  onSelectedIdsChange,
  defaultSelectedIds,
  disabledSelectionIds,
  enableColumnVisibility = false,
  columnVisibility: visibilityProp,
  onColumnVisibilityChange,
  enableGlobalFilter = false,
  globalFilter: globalFilterProp,
  onGlobalFilterChange,
  getGlobalFilterValue,
  globalFilterPlaceholder = "Search...",
  pagination,
  toolbarActions,
}: DataGridProps<T>) {
  const [internalSort, setInternalSort] = useState<SortState | null>(
    defaultSort,
  );
  const sort = sortProp !== undefined ? sortProp : internalSort;

  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(
    defaultSelectedIds ?? new Set(),
  );
  const selectedIds =
    selectedIdsProp !== undefined ? selectedIdsProp : internalSelectedIds;

  const [internalVisibility, setInternalVisibility] = useState<
    Record<string, boolean>
  >(() => Object.fromEntries(columns.map((c) => [c.id, !c.hidden])));
  const visibility =
    visibilityProp !== undefined ? visibilityProp : internalVisibility;

  const [internalGlobalFilter, setInternalGlobalFilter] = useState("");
  const globalFilter =
    globalFilterProp !== undefined ? globalFilterProp : internalGlobalFilter;

  const scrollRef = useRef<HTMLDivElement>(null);

  function handleHeaderClick(col: Column<T>) {
    if (!col.sortable) return;
    const next = nextSortState(sort, col.id);
    onSortChange?.(next);
    if (sortProp === undefined) setInternalSort(next);
  }

  function setSelectedIds(next: Set<string>) {
    onSelectedIdsChange?.(next);
    if (selectedIdsProp === undefined) setInternalSelectedIds(next);
  }

  function setVisibility(next: Record<string, boolean>) {
    onColumnVisibilityChange?.(next);
    if (visibilityProp === undefined) setInternalVisibility(next);
  }

  function setGlobalFilter(next: string) {
    onGlobalFilterChange?.(next);
    if (globalFilterProp === undefined) setInternalGlobalFilter(next);
  }

  const visibleColumns = useMemo(
    () => columns.filter((c) => visibility[c.id] !== false),
    [columns, visibility],
  );
  const stickyOffsets = useMemo(
    () => computeStickyOffsets(visibleColumns),
    [visibleColumns],
  );

  const filtered = useMemo(() => {
    if (!enableGlobalFilter || !getGlobalFilterValue || !globalFilter.trim())
      return data;
    return data.filter((row) =>
      matchesGlobalFilter(getGlobalFilterValue(row), globalFilter),
    );
  }, [data, enableGlobalFilter, getGlobalFilterValue, globalFilter]);

  const rows = useMemo(
    () => sortRows(filtered, columns, sort),
    [filtered, columns, sort],
  );

  const selectableRowIds = useMemo(
    () => rows.map(getRowId).filter((id) => !disabledSelectionIds?.has(id)),
    [rows, getRowId, disabledSelectionIds],
  );
  const selectedOnPageCount = selectableRowIds.filter((id) =>
    selectedIds.has(id),
  ).length;
  const allOnPageSelected =
    selectableRowIds.length > 0 &&
    selectedOnPageCount === selectableRowIds.length;
  const someOnPageSelected = selectedOnPageCount > 0 && !allOnPageSelected;

  function toggleSelectAll() {
    const next = new Set(selectedIds);
    if (allOnPageSelected) {
      selectableRowIds.forEach((id) => next.delete(id));
    } else {
      selectableRowIds.forEach((id) => next.add(id));
    }
    setSelectedIds(next);
  }

  function toggleRow(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  const { totalHeight, startIndex, endIndex, offsetY } = useVirtualizedRows(
    rows.length,
    scrollRef,
    rowHeight,
  );
  const visibleRows = rows.slice(startIndex, endIndex);

  const showToolbar =
    enableGlobalFilter || enableColumnVisibility || !!toolbarActions;

  return (
    <div className={cn("w-full", className)}>
      {showToolbar && (
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          {enableGlobalFilter ? (
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none"
              />
              <input
                type="text"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={globalFilterPlaceholder}
                aria-label={globalFilterPlaceholder}
                className={cn(
                  "w-full pl-9 pr-3 py-2 text-sm bg-surface border border-border rounded-md text-text-primary",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                )}
              />
            </div>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            {toolbarActions}
            {enableColumnVisibility && (
              <Popover
                align="end"
                trigger={
                  <Button variant="outline" size="sm">
                    <Columns3 aria-hidden="true" className="w-3.5 h-3.5" />
                    Columns
                  </Button>
                }
              >
                <div className="flex flex-col gap-1 min-w-[160px]">
                  {columns.map((col) => (
                    <label
                      key={col.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-text-primary hover:bg-surface-secondary cursor-pointer"
                    >
                      <GridCheckbox
                        label={`Toggle ${String(col.header)} column`}
                        checked={visibility[col.id] !== false}
                        onChange={(checked) =>
                          setVisibility({ ...visibility, [col.id]: checked })
                        }
                      />
                      {col.header}
                    </label>
                  ))}
                </div>
              </Popover>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <SkeletonTable
          rows={skeletonRows}
          columns={visibleColumns.length + (selectable ? 1 : 0)}
          density={density}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
          size="sm"
        />
      ) : (
        <div
          ref={scrollRef}
          className="w-full overflow-auto border border-border rounded-lg"
          style={{ maxHeight }}
        >
          <table
            className="w-full text-sm border-collapse"
            style={{ tableLayout: "fixed" }}
          >
            <thead>
              <tr className="sticky top-0 z-20 bg-surface">
                {selectable && (
                  <th
                    scope="col"
                    style={{ width: CHECKBOX_COL_WIDTH }}
                    className={cn(
                      CELL_PADDING[density],
                      "border-b border-border sticky left-0 z-30 bg-surface",
                    )}
                  >
                    <GridCheckbox
                      label="Select all rows on this page"
                      checked={allOnPageSelected}
                      indeterminate={someOnPageSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                {visibleColumns.map((col) => {
                  const isSorted = sort?.columnId === col.id;
                  const sticky = stickyOffsets.get(col.id);
                  return (
                    <th
                      key={col.id}
                      scope="col"
                      style={{
                        width: col.width,
                        minWidth: col.minWidth,
                        ...(sticky?.left !== undefined
                          ? {
                              position: "sticky",
                              left:
                                sticky.left +
                                (selectable ? CHECKBOX_COL_WIDTH : 0),
                              zIndex: 30,
                            }
                          : sticky?.right !== undefined
                            ? {
                                position: "sticky",
                                right: sticky.right,
                                zIndex: 30,
                              }
                            : {}),
                      }}
                      className={cn(
                        CELL_PADDING[density],
                        ALIGN_CLASSES[col.align ?? "left"],
                        "font-semibold text-xs text-text-secondary uppercase tracking-wide border-b border-border whitespace-nowrap",
                        col.sortable &&
                          "cursor-pointer select-none hover:text-text-primary",
                        col.sticky && "bg-surface",
                      )}
                      aria-sort={
                        isSorted
                          ? sort!.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                    >
                      {col.sortable ? (
                        <button
                          type="button"
                          onClick={() => handleHeaderClick(col)}
                          className={cn(
                            "inline-flex items-center gap-1",
                            col.align === "right" && "flex-row-reverse",
                            col.align === "center" && "justify-center w-full",
                            SORT_BUTTON_FOCUS_CLASSES,
                          )}
                        >
                          {col.header}
                          <SortIcon
                            direction={isSorted ? sort!.direction : undefined}
                          />
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="relative divide-y divide-divider">
              {startIndex > 0 && (
                <tr style={{ height: offsetY }} aria-hidden="true">
                  <td
                    colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                    className="p-0"
                  />
                </tr>
              )}
              {visibleRows.map((row, i) => {
                const rowIndex = startIndex + i;
                const id = getRowId(row);
                const disabled = disabledSelectionIds?.has(id) ?? false;
                const selected = selectedIds.has(id);
                return (
                  <tr
                    key={id}
                    style={{ height: rowHeight }}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={clickableRowKeyDown(row, onRowClick)}
                    tabIndex={onRowClick ? 0 : undefined}
                    className={cn(
                      onRowClick && "cursor-pointer",
                      "bg-surface hover:bg-surface-secondary transition-colors duration-fast ease-standard",
                      selected && "bg-primary-surface",
                      onRowClick && CLICKABLE_ROW_FOCUS_CLASSES,
                    )}
                  >
                    {selectable && (
                      <td
                        className={cn(
                          CELL_PADDING[density],
                          "sticky left-0 z-10 bg-inherit",
                        )}
                      >
                        <GridCheckbox
                          label={`Select row ${rowIndex + 1}`}
                          checked={selected}
                          disabled={disabled}
                          onChange={() => toggleRow(id)}
                        />
                      </td>
                    )}
                    {visibleColumns.map((col) => {
                      const sticky = stickyOffsets.get(col.id);
                      return (
                        <td
                          key={col.id}
                          style={
                            sticky?.left !== undefined
                              ? {
                                  position: "sticky",
                                  left:
                                    sticky.left +
                                    (selectable ? CHECKBOX_COL_WIDTH : 0),
                                  zIndex: 10,
                                }
                              : sticky?.right !== undefined
                                ? {
                                    position: "sticky",
                                    right: sticky.right,
                                    zIndex: 10,
                                  }
                                : undefined
                          }
                          className={cn(
                            CELL_PADDING[density],
                            ALIGN_CLASSES[col.align ?? "left"],
                            "text-text-primary truncate",
                            col.sticky && "bg-inherit",
                          )}
                        >
                          {col.cell(row, rowIndex)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {endIndex < rows.length && (
                <tr
                  style={{ height: totalHeight - endIndex * rowHeight }}
                  aria-hidden="true"
                >
                  <td
                    colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                    className="p-0"
                  />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {pagination && rows.length > 0 && (
        <div className="mt-4">
          <Pagination {...pagination} />
        </div>
      )}
    </div>
  );
}
