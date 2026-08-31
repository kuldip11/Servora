import { usePermissions } from "../../../shared/auth/permissions";
import { useMemo, useState } from "react";
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
  type Column,
  type SortState,
  BUTTON_VARIANT_CLASSES,
} from "@pos/ui";
import { formatCurrency, formatTime } from "../../../shared/utils/format";
import {
  getOrderStatusColor,
  getOrderStatusLabel,
} from "../../../shared/utils/order-status";
import { useOrders } from "../hooks/useOrders";
import { useOrdersRealtimeSync } from "../hooks/useOrdersRealtimeSync";
import { CreateOrderModal } from "../components/CreateOrderModal";
import type { Order } from "@pos/types";

const STATUS_TONE: Partial<
  Record<string, "info" | "warning" | "neutral" | "danger">
> = {
  OPEN: "info",
  BILL_REQUESTED: "warning",
  CLOSED: "neutral",
  CANCELLED: "danger",

};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "OPEN", label: "Open" },
  { value: "BILL_REQUESTED", label: "Bill Requested" },
  { value: "PAID", label: "Paid" },
  { value: "CLOSED", label: "Closed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "DINE_IN", label: "Dine In" },
  { value: "TAKEAWAY", label: "Takeaway" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "ONLINE", label: "Online" },
];

function KitchenStatus({ order }: { order: Order }) {
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
}

export function OrdersPage() {
  const { has } = usePermissions();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [sort, setSort] = useState<SortState | null>(null);

  const { data: orders, isLoading } = useOrders({
    status: statusFilter,
    type: typeFilter,
  });
  useOrdersRealtimeSync();

  const filtered = useMemo(
    () =>
      orders?.filter(
        (o) => !search || o.id.toLowerCase().includes(search.toLowerCase()),
      ) ?? [],
    [orders, search],
  );

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
          const tone = STATUS_TONE[row.status];
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
    <Page>
      <Card padding="none">
        <div className="p-md border-b border-border">
          <Toolbar
            title="Orders"
            subtitle={`${orders?.length ?? 0} total orders`}
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
                  }
                : undefined
            }
          >
            <SearchInput
              placeholder="Search order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
              className="max-w-xs"
            />
            <SelectMenu
              label="Status filter"
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v ?? "")}
              className="w-44"
            />
            <SelectMenu
              label="Order type filter"
              options={TYPE_OPTIONS}
              value={typeFilter}
              onChange={(v) => setTypeFilter(v ?? "")}
              className="w-40"
            />
          </FilterBar>
        </div>

        <div className="p-md">
          <DataGrid
            columns={columns}
            data={filtered}
            getRowId={(row) => row.id}
            loading={isLoading}
            sort={sort}
            onSortChange={setSort}
            rowHeight={52}
            maxHeight="640px"
            emptyIcon={ShoppingBag}
            emptyTitle="No orders found"
            emptyDescription="Create a new order or adjust your filters."
            emptyAction={
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" /> New Order
              </Button>
            }
          />
        </div>
      </Card>

      {showCreate && <CreateOrderModal onClose={() => setShowCreate(false)} />}
    </Page>
  );
}
