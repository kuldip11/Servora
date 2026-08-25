import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "../../utils/cn";
import { IconButton } from "../IconButton";

/**
 * Phase 7 (Part 1) — `Pagination`. Controlled-only (`page`/`onPageChange`),
 * matching every other controlled component in this package rather than
 * the `Table`/`Sidebar` controlled-with-fallback pattern — pagination state
 * is almost always driven by a query param or a data-fetching hook already
 * holding it, so there's no real "uncontrolled" use case the way a UI-only
 * concern like sort or sidebar-collapse has.
 *
 * `page` is 1-indexed throughout this component's public API (matches how
 * page numbers are actually displayed — `page={1}` is the first page, not
 * `page={0}`), even though most pagination *libraries* default to 0-indexed.
 */

export interface PaginationProps {
  /** 1-indexed current page. */
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Total row count, for the "Showing X–Y of Z" caption. Omit to hide the caption. */
  totalItems?: number | undefined;
  pageSize?: number | undefined;
  onPageSizeChange?: ((pageSize: number) => void) | undefined;
  pageSizeOptions?: number[] | undefined;
  className?: string | undefined;
}

/** Builds a windowed page list with `'ellipsis'` gaps: always shows the first
 * and last page, the current page, and one neighbor on each side. */
function buildPageWindow(
  page: number,
  pageCount: number,
): (number | "ellipsis")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set<number>([1, pageCount, page, page - 1, page + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= pageCount)
    .sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0) {
      const prev = sorted[i - 1]!;
      if (p - prev === 2) out.push(prev + 1);
      else if (p - prev > 2) out.push("ellipsis");
    }
    out.push(p);
  });
  return out;
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  totalItems,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className,
}: PaginationProps) {
  const safePageCount = Math.max(1, pageCount);
  const pageWindow = buildPageWindow(page, safePageCount);

  const rangeStart = pageSize ? (page - 1) * pageSize + 1 : undefined;
  const rangeEnd =
    pageSize && totalItems !== undefined
      ? Math.min(page * pageSize, totalItems)
      : undefined;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 flex-wrap",
        className,
      )}
    >
      <div className="flex items-center gap-4 text-sm text-text-secondary">
        {totalItems !== undefined &&
          rangeStart !== undefined &&
          rangeEnd !== undefined && (
            <span>
              Showing{" "}
              <span className="font-medium text-text-primary">
                {rangeStart}
              </span>
              –<span className="font-medium text-text-primary">{rangeEnd}</span>{" "}
              of{" "}
              <span className="font-medium text-text-primary">
                {totalItems}
              </span>
            </span>
          )}
        {onPageSizeChange && (
          <label className="flex items-center gap-2">
            Rows per page
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-surface border border-border rounded-md px-2 py-1 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <nav aria-label="Pagination" className="flex items-center gap-1">
        <IconButton
          icon={ChevronLeft}
          aria-label="Previous page"
          variant="ghost"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        />

        {pageWindow.map((p, i) =>
          p === "ellipsis" ? (
            <span
              key={`e${i}`}
              className="w-8 h-8 flex items-center justify-center text-text-disabled"
            >
              <MoreHorizontal className="w-4 h-4" />
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === page ? "page" : undefined}
              onClick={() => onPageChange(p)}
              className={cn(
                "w-8 h-8 rounded-md text-sm font-medium transition-colors duration-fast ease-standard",
                p === page
                  ? "bg-primary text-primary-foreground"
                  : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
              )}
            >
              {p}
            </button>
          ),
        )}

        <IconButton
          icon={ChevronRight}
          aria-label="Next page"
          variant="ghost"
          size="sm"
          disabled={page >= safePageCount}
          onClick={() => onPageChange(page + 1)}
        />
      </nav>
    </div>
  );
}
