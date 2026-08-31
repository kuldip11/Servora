import { type ComponentType, type ReactNode, useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Inbox } from "lucide-react";
import { cn } from "../../utils/cn";
import { EmptyState } from "../EmptyState";
import {
  ALIGN_CLASSES,
  CELL_PADDING,
  CLICKABLE_ROW_FOCUS_CLASSES,
  clickableRowKeyDown,
  type Column,
  nextSortState,
  SORT_BUTTON_FOCUS_CLASSES,
  sortRows,
  type SortState,
  type TableDensity,
} from "./shared";

export type { Column, SortState, TableDensity };

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];

  getRowId: (row: T) => string;
  loading?: boolean | undefined;

  skeletonRows?: number | undefined;
  emptyIcon?: ComponentType<{ className?: string }> | undefined;
  emptyTitle?: string | undefined;
  emptyDescription?: string | undefined;
  emptyAction?: ReactNode;
  onRowClick?: ((row: T) => void) | undefined;

  sort?: SortState | null | undefined;
  onSortChange?: ((sort: SortState | null) => void) | undefined;

  defaultSort?: SortState | null | undefined;

  density?: TableDensity | undefined;

  stickyHeader?: boolean | undefined;

  maxHeight?: string | undefined;
  className?: string | undefined;

  "aria-label"?: string | undefined;

  "aria-labelledby"?: string | undefined;
}

function SortIcon({ direction }: { direction: SortDirectionOrNone }) {
  if (direction === "asc")
    return <ChevronUp aria-hidden="true" className="w-3.5 h-3.5" />;
  if (direction === "desc")
    return <ChevronDown aria-hidden="true" className="w-3.5 h-3.5" />;
  return (
    <ChevronsUpDown aria-hidden="true" className="w-3.5 h-3.5 opacity-40" />
  );
}
type SortDirectionOrNone = "asc" | "desc" | undefined;

export function Table<T>({
  columns,
  data,
  getRowId,
  loading = false,
  skeletonRows = 5,
  emptyIcon = Inbox,
  emptyTitle = "No data",
  emptyDescription,
  emptyAction,
  onRowClick,
  sort: sortProp,
  onSortChange,
  defaultSort = null,
  density = "comfortable",
  stickyHeader = true,
  maxHeight,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: TableProps<T>) {
  const [internalSort, setInternalSort] = useState<SortState | null>(
    defaultSort,
  );
  const sort = sortProp !== undefined ? sortProp : internalSort;

  function handleHeaderClick(col: Column<T>) {
    if (!col.sortable) return;
    const next = nextSortState(sort, col.id);
    onSortChange?.(next);
    if (sortProp === undefined) setInternalSort(next);
  }

  if (loading) {
    return (
      <div className={cn("w-full overflow-x-auto", className)} aria-busy="true">
        <table
          className="w-full text-sm border-collapse"
          aria-label={ariaLabelledBy ? undefined : ariaLabel}
          aria-labelledby={ariaLabelledBy}
        >
          <tbody>
            {Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <tr key={rowIndex} aria-hidden="true">
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={cn(
                      CELL_PADDING[density],
                      ALIGN_CLASSES[col.align ?? "left"],
                    )}
                  >
                    <div className="h-3 w-full rounded-md bg-surface-secondary animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
          size="sm"
        />
      </div>
    );
  }

  const rows = sortRows(data, columns, sort);

  return (
    <div
      className={cn(
        "w-full overflow-x-auto",
        maxHeight && "overflow-y-auto",
        className,
      )}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <table
        className="w-full text-sm border-collapse"
        aria-label={ariaLabelledBy ? undefined : ariaLabel}
        aria-labelledby={ariaLabelledBy}
      >
        <thead>
          <tr className={cn(stickyHeader && "sticky top-0 z-10", "bg-surface")}>
            {columns.map((col) => {
              const isSorted = sort?.columnId === col.id;
              return (
                <th
                  key={col.id}
                  scope="col"
                  style={{ width: col.width, minWidth: col.minWidth }}
                  className={cn(
                    CELL_PADDING[density],
                    ALIGN_CLASSES[col.align ?? "left"],
                    "font-semibold text-xs text-text-secondary uppercase tracking-wide border-b border-border whitespace-nowrap",
                    col.sortable &&
                      "cursor-pointer select-none hover:text-text-primary",
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
        <tbody className="divide-y divide-divider">
          {rows.map((row, rowIndex) => (
            <tr
              key={getRowId(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={clickableRowKeyDown(row, onRowClick)}
              tabIndex={onRowClick ? 0 : undefined}
              className={cn(
                onRowClick &&
                  "cursor-pointer hover:bg-surface-secondary transition-colors duration-fast ease-standard",
                onRowClick && CLICKABLE_ROW_FOCUS_CLASSES,
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.id}
                  className={cn(
                    CELL_PADDING[density],
                    ALIGN_CLASSES[col.align ?? "left"],
                    "text-text-primary",
                  )}
                >
                  {col.cell(row, rowIndex)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
