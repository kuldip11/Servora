import { useMemo, useState } from "react";
import {
  AppShell,
  Page,
  PageHeader,
  Section,
  Card,
  Stack,
  StatusBadge,
  Button,
  SearchInput,
  SelectMenu,
  Table,
  DataGrid,
  type Column,
  type SortState,
  Pagination,
  FilterBar,
  Toolbar,
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  EmptyState,
} from "@pos/ui";
import { ShoppingBag, Plus, RefreshCcw, Trash2 } from "lucide-react";

/**
 * Internal-only route (`/dev/data-preview`, no auth guard). Covers
 * both parts of Phase 7 (docs/design-system/README.md's "Phase 7
 * detail"): Part 1's `Table`/`Pagination`/`FilterBar`/`Toolbar`/
 * `SkeletonLoader`/upgraded `EmptyState`, and Part 2's `DataGrid`. The
 * plan's actual exit criterion — the Admin Orders migration — is
 * exercised for real on `/orders` (`apps/web/src/features/orders/pages/
 * OrdersPage.tsx`), not here; this page's `DataGrid` section is a
 * second, larger-scale fixture demo (1,000 rows) so virtualization,
 * sticky columns, and bulk selection all have something to try beyond
 * Orders' realistic-but-small dataset.
 *
 * Sample data below is fixture data local to this page — not fetched
 * from `apps/api` — so this preview works with no backend running,
 * same convention every other `/dev/*-preview` route in this app uses.
 *
 * Manual checks to run against this page's `Table` section before
 * calling Part 1 done:
 * - Click "Order ID" / "Total" column headers: confirm the sort cycles
 *   asc → desc → back to unsorted (the chevron icon reflects each
 *   state), and that clicking a different column resets the previous
 *   one.
 * - Tab through the whole page with no mouse: header sort buttons,
 *   filter controls, "Clear filters", every table row (via
 *   `onRowClick`), and the pagination controls should all be reachable
 *   and operable via Enter/Space.
 * - Toggle "Simulate loading": confirm `Table` swaps to `SkeletonTable`
 *   with the same column count, not a layout jump.
 * - Filter to a status with zero matches: confirm `Table` renders
 *   `EmptyState` (size="sm") in place of the `<table>`, not an empty
 *   `<table>` with no rows.
 *
 * Manual checks to run against the `DataGrid` section before calling
 * Part 2 done — the 1,000-row fixture set is paginated (50/page)
 * *before* being handed to `DataGrid`, so each page virtualizes 50
 * rows inside a 440px viewport; see the `gridFiltered`/`gridPageRows`
 * comment below for why filtering happens before that slice, not after:
 * - Scroll a page: confirm it stays smooth and the header row + "ID"
 *   column stay pinned (sticky) while scrolling both axes.
 * - Check the header checkbox, then change page: confirm the checked
 *   rows from the previous page stay checked (`selectedIds` is a plain
 *   `Set`, not scoped to the current page) and the header checkbox on
 *   the new page starts unchecked (it reflects only the page it's on).
 * - Open "Columns", hide a couple of columns: confirm the grid
 *   reflows and the sticky "ID" column's pinned position doesn't shift
 *   relative to the remaining visible columns.
 * - Type in the built-in search box: confirm it filters by order id or
 *   customer name across all 1,000 rows (not just the current page)
 *   and resets to page 1.
 */

interface SampleOrder {
  id: string;
  type: "Dine In" | "Takeaway" | "Delivery";
  table: string | null;
  items: number;
  total: number;
  status: "Open" | "Bill Requested" | "Paid" | "Cancelled";
  time: string;
}

const STATUS_TONE: Record<
  SampleOrder["status"],
  "info" | "warning" | "success" | "danger"
> = {
  Open: "info",
  "Bill Requested": "warning",
  Paid: "success",
  Cancelled: "danger",
};

const SAMPLE_ORDERS: SampleOrder[] = [
  {
    id: "ORD-A1B2C3",
    type: "Dine In",
    table: "T-04",
    items: 3,
    total: 42.5,
    status: "Open",
    time: "12:04 PM",
  },
  {
    id: "ORD-D4E5F6",
    type: "Takeaway",
    table: null,
    items: 1,
    total: 11.0,
    status: "Paid",
    time: "12:01 PM",
  },
  {
    id: "ORD-G7H8I9",
    type: "Delivery",
    table: null,
    items: 5,
    total: 68.25,
    status: "Bill Requested",
    time: "11:56 AM",
  },
  {
    id: "ORD-J1K2L3",
    type: "Dine In",
    table: "T-11",
    items: 2,
    total: 27.0,
    status: "Paid",
    time: "11:50 AM",
  },
  {
    id: "ORD-M4N5O6",
    type: "Dine In",
    table: "T-02",
    items: 4,
    total: 55.75,
    status: "Cancelled",
    time: "11:42 AM",
  },
  {
    id: "ORD-P7Q8R9",
    type: "Takeaway",
    table: null,
    items: 2,
    total: 19.5,
    status: "Open",
    time: "11:38 AM",
  },
  {
    id: "ORD-S1T2U3",
    type: "Delivery",
    table: null,
    items: 6,
    total: 81.0,
    status: "Paid",
    time: "11:30 AM",
  },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "Open", label: "Open" },
  { value: "Bill Requested", label: "Bill Requested" },
  { value: "Paid", label: "Paid" },
  { value: "Cancelled", label: "Cancelled" },
];

// --- DataGrid fixture data (Part 2) — 1,000 rows so virtualization has
// something real to do; Table's 7-row set above stays as-is since it's
// meant to be small (it's the "does the simple component work" demo).
interface GridOrder {
  id: string;
  customer: string;
  type: SampleOrder["type"];
  items: number;
  total: number;
  status: SampleOrder["status"];
  time: string;
}

const CUSTOMER_NAMES = [
  "Aarav Shah",
  "Priya Nair",
  "Kabir Rao",
  "Ishaan Verma",
  "Meera Iyer",
  "Diya Kapoor",
  "Vihaan Joshi",
  "Anaya Singh",
];

const GRID_ORDERS: GridOrder[] = Array.from({ length: 1000 }, (_, i) => {
  const types: SampleOrder["type"][] = ["Dine In", "Takeaway", "Delivery"];
  const statuses: SampleOrder["status"][] = [
    "Open",
    "Bill Requested",
    "Paid",
    "Cancelled",
  ];
  return {
    id: `ORD-${(100000 + i).toString(36).toUpperCase()}`,
    customer: CUSTOMER_NAMES[i % CUSTOMER_NAMES.length]!,
    type: types[i % types.length]!,
    items: 1 + (i % 6),
    total: 12.5 + (i % 40) * 3.75,
    status: statuses[i % statuses.length]!,
    time: `${(9 + (i % 10)).toString().padStart(2, "0")}:${(i % 6) * 10 || "00"} AM`,
  };
});

export function DataPreviewPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState<SortState | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return SAMPLE_ORDERS.filter((o) => {
      if (search && !o.id.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (statusFilter && o.status !== statusFilter) return false;
      return true;
    });
  }, [search, statusFilter]);

  const hasActiveFilters = search !== "" || statusFilter !== "";

  // --- DataGrid demo state (Part 2) ---
  const [gridSort, setGridSort] = useState<SortState | null>(null);
  const [gridSelected, setGridSelected] = useState<Set<string>>(new Set());
  const [gridSearch, setGridSearch] = useState("");
  const [gridPage, setGridPage] = useState(1);
  const gridPageSize = 50;

  // Filtered *before* paginating, then the current page is sliced from that —
  // not the other way around. Passing pre-filtered data lets DataGrid's
  // `enableGlobalFilter` render the search box while omitting
  // `getGlobalFilterValue` below (documented as the "server-side search,
  // rows are trusted as already-filtered" mode): the alternative — slicing
  // to a page first and letting DataGrid's own filter run on just that
  // page — would only ever search the 50 rows currently on-screen.
  const gridFiltered = useMemo(() => {
    if (!gridSearch.trim()) return GRID_ORDERS;
    const q = gridSearch.trim().toLowerCase();
    return GRID_ORDERS.filter(
      (o) =>
        o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q),
    );
  }, [gridSearch]);
  const gridPageCount = Math.max(
    1,
    Math.ceil(gridFiltered.length / gridPageSize),
  );
  const gridPageStart = (gridPage - 1) * gridPageSize;
  const gridPageRows = gridFiltered.slice(
    gridPageStart,
    gridPageStart + gridPageSize,
  );

  function handleGridSearchChange(value: string) {
    setGridSearch(value);
    setGridPage(1);
  }

  const gridColumns: Column<GridOrder>[] = [
    {
      id: "id",
      header: "ID",
      sortable: true,
      sortValue: (row) => row.id,
      sticky: "left",
      width: "140px",
      cell: (row) => (
        <span className="font-mono text-xs font-semibold">{row.id}</span>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      width: "160px",
      cell: (row) => row.customer,
    },
    { id: "type", header: "Type", width: "110px", cell: (row) => row.type },
    {
      id: "items",
      header: "Items",
      align: "right",
      width: "80px",
      cell: (row) => row.items,
    },
    {
      id: "total",
      header: "Total",
      align: "right",
      sortable: true,
      width: "100px",
      sortValue: (row) => row.total,
      cell: (row) => (
        <span className="font-semibold">${row.total.toFixed(2)}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      width: "140px",
      cell: (row) => (
        <StatusBadge label={row.status} tone={STATUS_TONE[row.status]} />
      ),
    },
    {
      id: "time",
      header: "Time",
      width: "90px",
      cell: (row) => (
        <span className="text-text-secondary text-xs">{row.time}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      sticky: "right",
      width: "60px",
      align: "right",
      cell: () => (
        <button
          type="button"
          aria-label="Delete order"
          className="text-text-secondary hover:text-danger p-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  const columns: Column<SampleOrder>[] = [
    {
      id: "id",
      header: "Order ID",
      sortable: true,
      sortValue: (row) => row.id,
      cell: (row) => (
        <span className="font-mono text-xs font-semibold">{row.id}</span>
      ),
    },
    { id: "type", header: "Type", cell: (row) => row.type },
    {
      id: "table",
      header: "Table",
      cell: (row) => row.table ?? <span className="text-text-disabled">—</span>,
    },
    { id: "items", header: "Items", align: "right", cell: (row) => row.items },
    {
      id: "total",
      header: "Total",
      align: "right",
      sortable: true,
      sortValue: (row) => row.total,
      cell: (row) => (
        <span className="font-semibold">${row.total.toFixed(2)}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge label={row.status} tone={STATUS_TONE[row.status]} />
      ),
    },
    {
      id: "time",
      header: "Time",
      cell: (row) => (
        <span className="text-text-secondary text-xs">{row.time}</span>
      ),
    },
  ];

  return (
    <AppShell>
      <Page>
        <PageHeader
          title="Data Preview"
          description="Phase 7 (Part 1): Table, Pagination, FilterBar, Toolbar, SkeletonLoader, EmptyState."
        />

        <Section title="Table — sortable, sticky header, row click">
          <Card padding="none">
            <div className="p-md border-b border-border">
              <Toolbar
                title="Orders"
                subtitle={`${filtered.length} of ${SAMPLE_ORDERS.length} orders`}
                actions={
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setLoading((v) => !v)}
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                      {loading ? "Stop loading" : "Simulate loading"}
                    </Button>
                    <Button size="sm">
                      <Plus className="w-3.5 h-3.5" />
                      New Order
                    </Button>
                  </>
                }
              />
              <FilterBar
                className="mt-4"
                onClearAll={
                  hasActiveFilters
                    ? () => {
                        setSearch("");
                        setStatusFilter("");
                      }
                    : undefined
                }
              >
                <SearchInput
                  placeholder="Search order ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-xs"
                />
                <SelectMenu
                  label="Status filter"
                  options={STATUS_OPTIONS}
                  value={statusFilter}
                  onChange={(v) => setStatusFilter(v ?? "")}
                  className="w-44"
                />
              </FilterBar>
            </div>

            <Table
              columns={columns}
              data={filtered}
              getRowId={(row) => row.id}
              loading={loading}
              sort={sort}
              onSortChange={setSort}
              onRowClick={(row) => setSelectedOrder(row.id)}
              emptyIcon={ShoppingBag}
              emptyTitle="No orders found"
              emptyDescription="Try a different search or clear your filters."
            />

            <div className="p-md border-t border-border">
              <Pagination
                page={page}
                pageCount={5}
                onPageChange={setPage}
                totalItems={SAMPLE_ORDERS.length}
                pageSize={7}
              />
            </div>
          </Card>
          {selectedOrder && (
            <p className="text-sm text-text-secondary mt-2">
              Row clicked: {selectedOrder}
            </p>
          )}
        </Section>

        <Section title="DataGrid — 1,000 rows, virtualized, sticky columns, bulk select, column visibility">
          <Card padding="none">
            <div className="p-md">
              <DataGrid
                columns={gridColumns}
                data={gridPageRows}
                getRowId={(row) => row.id}
                sort={gridSort}
                onSortChange={setGridSort}
                selectable
                selectedIds={gridSelected}
                onSelectedIdsChange={setGridSelected}
                enableColumnVisibility
                enableGlobalFilter
                globalFilter={gridSearch}
                onGlobalFilterChange={handleGridSearchChange}
                globalFilterPlaceholder="Search order ID or customer..."
                rowHeight={44}
                maxHeight="440px"
                toolbarActions={
                  gridSelected.size > 0 ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setGridSelected(new Set())}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete {gridSelected.size} selected
                    </Button>
                  ) : undefined
                }
                pagination={{
                  page: gridPage,
                  pageCount: gridPageCount,
                  onPageChange: setGridPage,
                  totalItems: gridFiltered.length,
                  pageSize: gridPageSize,
                }}
              />
            </div>
          </Card>
          <p className="text-sm text-text-secondary mt-2">
            {gridSelected.size} row{gridSelected.size === 1 ? "" : "s"} selected
            across all pages.
          </p>
        </Section>

        <Section title='EmptyState — size="sm" (used inside Table) vs default'>
          <Stack direction="row" gap="md">
            <Card className="flex-1">
              <EmptyState
                icon={ShoppingBag}
                title="No orders yet"
                description="New orders will show up here."
                size="sm"
              />
            </Card>
            <Card className="flex-1">
              <EmptyState
                icon={ShoppingBag}
                title="No orders yet"
                description="New orders will show up here."
                action={
                  <Button size="sm">
                    <Plus className="w-3.5 h-3.5" /> New Order
                  </Button>
                }
              />
            </Card>
          </Stack>
        </Section>

        <Section title="SkeletonLoader primitives">
          <Stack direction="row" gap="md">
            <Card className="flex-1">
              <Stack gap="sm">
                <Skeleton height="1.25rem" width="40%" />
                <SkeletonText lines={3} />
              </Stack>
            </Card>
            <Card className="flex-1" padding="none">
              <SkeletonCard withMedia className="border-0" />
            </Card>
            <Card className="flex-1" padding="none">
              <SkeletonTable rows={4} columns={3} />
            </Card>
          </Stack>
        </Section>
      </Page>
    </AppShell>
  );
}
