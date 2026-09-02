import { usePermissions } from "@/shared/auth/permissions";
import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Eye, ShoppingBag } from "lucide-react";
import {
  Button,
  Badge,
  StatusBadge,
  SearchInput,
  SelectMenu,
  DataGrid,
  FilterBar,
  Toolbar,
  Page,
  Card,
  Pagination,
  type Column,
  type SortState,
  BUTTON_VARIANT_CLASSES,
} from "@pos/ui";
import { formatCurrency, formatTime } from "@/shared/utils/format";
import {
  getOrderStatusColor,
  getOrderStatusLabel,
} from "@/shared/utils/order-status";
import { useOrdersPage } from "@/features/orders/hooks/useOrders";
import { useOrdersRealtimeSync } from "@/features/orders/hooks/useOrdersRealtimeSync";
import { CreateOrderModal } from "@/features/orders/components/CreateOrderModal";
import type { Order } from "@pos/types";

import {
  ORDER_STATUS_OPTIONS,
  ORDER_STATUS_TONE,
  ORDER_TYPE_OPTIONS,
} from "@/features/orders/constants";

const KitchenStatus = ({ order }: { order: Order }) => {
  const tickets = order.kitchenTickets;
  if (!tickets?.length) return <span className="text-text-disabled">—</span>;
  if (tickets.some((t) => t.status === "READY")) {
    return <span className="text-success font-semibold text-xs">Ready</span>;
  }
  if (tickets.every((t) => t.status === "SERVED")) {
    return <span className="text-xs text-text-secondary">All served</span>;
  }
  return (
    <span className="text-xs text-text-secondary">
      {tickets.length} ticket{tickets.length > 1 ? "s" : ""}
    </span>
  );
};

export const OrdersPage = () => {
  const { has } = usePermissions();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [sort, setSort] = useState<SortState | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      300,
    );
    return () => window.clearTimeout(timer);
  }, [search]);

  const {
    data: result,
    isLoading,
    isFetching,
  } = useOrdersPage({
    status: statusFilter,
    type: typeFilter,
    search: debouncedSearch,
    page,
    limit: pageSize,
  });
  useOrdersRealtimeSync();
  const orders = result?.items ?? [];
  const total = result?.pagination.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const hasActiveFilters =
    search !== "" || statusFilter !== "" || typeFilter !== "";

  const columns: Column<Order>[] = useMemo(
    () => [
      {
        id: "id",
        header: "Order ID",
        sortable: true,
        sortValue: (row) => row.id,
        width: "140px",
        sticky: "left",
        cell: (row) => (
          <span className="font-mono text-xs font-semibold text-text-primary">
            #{row.id.slice(-8).toUpperCase()}
          </span>
        ),
      },
      {
        id: "type",
        header: "Type",
        width: "110px",
        cell: (row) => (
          <StatusBadge
            label={row.type?.replace("_", " ") ?? ""}
            tone="neutral"
            dot={false}
          />
        ),
      },
      {
        id: "table",
        header: "Table",
        width: "90px",
        cell: (row) =>
          row.table ? (
            row.table.name
          ) : (
            <span className="text-text-disabled">—</span>
          ),
      },
      {
        id: "kitchen",
        header: "Kitchen",
        width: "100px",
        cell: (row) => <KitchenStatus order={row} />,
      },
      {
        id: "items",
        header: "Items",
        align: "right",
        width: "80px",
        cell: (row) => `${row.items?.length ?? 0} items`,
      },
      {
        id: "total",
        header: "Total",
        align: "right",
        sortable: true,
        width: "110px",
        sortValue: (row) => parseFloat(String(row.totalAmount)),
        cell: (row) => (
          <span className="font-semibold text-text-primary">
            {formatCurrency(parseFloat(String(row.totalAmount)))}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        width: "140px",
        cell: (row) => {
          const tone = ORDER_STATUS_TONE[row.status];
          if (!tone) {
            return (
              <Badge className={getOrderStatusColor(row.status)}>
                {getOrderStatusLabel(row.status)}
              </Badge>
            );
          }
          return (
            <StatusBadge label={getOrderStatusLabel(row.status)} tone={tone} />
          );
        },
      },
      {
        id: "time",
        header: "Time",
        sortable: true,
        width: "90px",
        sortValue: (row) => new Date(row.createdAt).getTime(),
        cell: (row) => (
          <span className="text-text-secondary text-xs">
            {formatTime(row.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        width: "80px",
        sticky: "right",
        cell: (row) => (
          <Link
            to="/orders/$orderId"
            params={{ orderId: row.id }}
            onClick={(e) => e.stopPropagation()}
            className={`${BUTTON_VARIANT_CLASSES.secondary} px-2 py-1.5 text-xs inline-flex items-center gap-1`}
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </Link>
        ),
      },
    ],
    [],
  );

  return (
    <Page
      contained={false}
      className="mx-auto h-full min-h-0 w-full max-w-screen-xl overflow-hidden px-4 py-4 sm:px-6 lg:px-8"
    >
      <Card
        padding="none"
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="p-md border-b border-border">
          <Toolbar
            title="Orders"
            subtitle={`${total.toLocaleString()} total orders`}
            actions={
              has("orders:create") && (
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="w-4 h-4" />
                  New Order
                </Button>
              )
            }
          />
          <FilterBar
            className="mt-4"
            onClearAll={
              hasActiveFilters
                ? () => {
                    setSearch("");
                    setStatusFilter("");
                    setTypeFilter("");
                    setPage(1);
                  }
                : undefined
            }
          >
            <SearchInput
              placeholder="Search order ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              onClear={() => {
                setSearch("");
                setPage(1);
              }}
              className="max-w-xs"
            />
            <SelectMenu
              label="Status filter"
              options={ORDER_STATUS_OPTIONS}
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v ?? "");
                setPage(1);
              }}
              className="w-44"
            />
            <SelectMenu
              label="Order type filter"
              options={ORDER_TYPE_OPTIONS}
              value={typeFilter}
              onChange={(v) => {
                setTypeFilter(v ?? "");
                setPage(1);
              }}
              className="w-40"
            />
          </FilterBar>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-md">
          <DataGrid
            columns={columns}
            data={orders}
            getRowId={(row) => row.id}
            loading={isLoading || (isFetching && orders.length === 0)}
            sort={sort}
            onSortChange={setSort}
            rowHeight={52}
            maxHeight="100%"
            className="min-h-0 flex-1"
            emptyIcon={ShoppingBag}
            emptyTitle="No orders found"
            emptyDescription="Create a new order or adjust your filters."
            emptyAction={
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" /> New Order
              </Button>
            }
          />
          <Pagination
            className="border-t border-border px-2 pt-4 mt-4"
            page={page}
            pageCount={pageCount}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(next) => {
              setPageSize(next);
              setPage(1);
            }}
          />
        </div>
      </Card>

      {showCreate && <CreateOrderModal onClose={() => setShowCreate(false)} />}
    </Page>
  );
};
