import { useEffect, useState } from "react";
import {
  ChevronDown,
  MapPin,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";
import { Modal, SelectMenu } from "@pos/ui";
import { ALL_ORDER_TYPES } from "@/features/menu/constants";
import type { LoyaltyCustomer } from "@pos/types";
import type { RestaurantTableDto } from "@pos/api-client";

interface Props {
  availableOrderTypes: typeof ALL_ORDER_TYPES;
  orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  onOrderTypeChange: (type: "DINE_IN" | "TAKEAWAY" | "DELIVERY") => void;
  tablesEnabled: boolean;
  tables: RestaurantTableDto[] | undefined;
  tableId: string;
  onTableChange: (id: string) => void;
  customerId: string;
  customerName: string;
  onClearCustomer: () => void;
  customerSearch: string;
  onCustomerSearchChange: (value: string) => void;
  customerResults: LoyaltyCustomer[] | undefined;
  onSelectCustomer: (id: string, name: string) => void;
  customerGroups: Array<{ id: string; name: string }>;
  customerGroupId: string;
  onCustomerGroupChange: (id: string) => void;
  billingMode: "LINE_ITEMS" | "PER_COVER";
  onBillingModeChange: (mode: "LINE_ITEMS" | "PER_COVER") => void;
  coverCount: number;
  onCoverCountChange: (count: number) => void;
  perCoverRules: Array<{
    id: string;
    coverTier?: "ADULT" | "CHILD" | null;
    price: string | number | null;
  }>;
  perCoverPriceRuleId: string;
  onPerCoverPriceRuleChange: (id: string) => void;
}

export const buildTableOptions = (tables: RestaurantTableDto[]) =>
  [...tables]
    .filter((table) => table.isActive !== false)
    .sort((left, right) =>
      left.status === right.status
        ? left.name.localeCompare(right.name)
        : left.status === "AVAILABLE"
          ? -1
          : 1,
    )
    .map((table) => ({
      value: table.id,
      label: table.name,
      description:
        table.status === "AVAILABLE"
          ? `${table.capacity} seats`
          : (table.status ?? "Unavailable").charAt(0) +
            (table.status ?? "Unavailable").slice(1).toLowerCase(),
      group: table.status === "AVAILABLE" ? "Available" : "Unavailable",
      disabled: table.status !== "AVAILABLE",
    }));

export const OrderOptionsPanel = ({
  availableOrderTypes,
  orderType,
  onOrderTypeChange,
  tablesEnabled,
  tables,
  tableId,
  onTableChange,
  customerId,
  customerName,
  onClearCustomer,
  customerSearch,
  onCustomerSearchChange,
  customerResults,
  onSelectCustomer,
  customerGroups,
  customerGroupId,
  onCustomerGroupChange,
  billingMode,
  onBillingModeChange,
  coverCount,
  onCoverCountChange,
  perCoverRules,
  perCoverPriceRuleId,
  onPerCoverPriceRuleChange,
}: Props) => {
  const needsTable = orderType === "DINE_IN" && tablesEnabled;
  const selectedTable = tables?.find((table) => table.id === tableId);
  const contextReady =
    !needsTable ||
    Boolean(selectedTable && selectedTable.status === "AVAILABLE");
  const [editingContext, setEditingContext] = useState(!contextReady);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [tableStatusFilter, setTableStatusFilter] = useState("ALL");
  const [visibleTableCount, setVisibleTableCount] = useState(30);
  const orderTypeLabel =
    availableOrderTypes.find((type) => type.value === orderType)?.label ??
    orderType.replace("_", " ");

  useEffect(() => {
    if (!contextReady) setEditingContext(true);
  }, [contextReady]);

  const contextTitle = selectedTable?.name ?? orderTypeLabel;
  const contextDescription = [
    orderTypeLabel,
    selectedTable?.capacity ? `${selectedTable.capacity} seats` : null,
    customerName || null,
  ]
    .filter(Boolean)
    .join(" · ");
  const filteredTables = (tables ?? []).filter((table) => {
    const query = tableSearch.trim().toLowerCase();
    return (
      (!query ||
        `${table.name} ${table.section ?? ""}`.toLowerCase().includes(query)) &&
      (tableStatusFilter === "ALL" || table.status === tableStatusFilter)
    );
  });

  return (
    <>
      <div className="shrink-0 bg-background px-3.5 pt-2.5 md:px-4 md:pt-3">
        <button
          type="button"
          onClick={() => setEditingContext(true)}
          className={`flex min-h-[54px] w-full items-center gap-3 rounded-2xl border px-3 text-left transition-colors ${
            contextReady
              ? "border-primary-border bg-primary-surface"
              : "border-warning/30 bg-warning-surface"
          }`}
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              contextReady
                ? "bg-surface text-primary"
                : "bg-surface text-warning"
            }`}
          >
            <MapPin className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-sm font-semibold text-text-primary">
              {contextReady ? contextTitle : "Set order details"}
            </strong>
            <span className="block truncate text-xs text-text-secondary">
              {contextReady
                ? contextDescription
                : `${orderTypeLabel} · table required`}
            </span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-primary">
            {contextReady ? "Edit" : "Set up"}
          </span>
        </button>
      </div>

      <Modal
        open={editingContext}
        onClose={() => setEditingContext(false)}
        title="Order details"
        description="Choose the service type, table, customer, and billing settings for this order."
        size="lg"
        preventDismiss={!contextReady}
        footer={
          <button
            type="button"
            disabled={!contextReady}
            onClick={() => setEditingContext(false)}
            className="min-h-11 w-full rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            Show menu
          </button>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Service type
            </p>
            <div className="grid grid-cols-3 gap-2">
              {availableOrderTypes.map(({ value, label }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => {
                    onOrderTypeChange(value);
                    if (value !== "DINE_IN") onTableChange("");
                  }}
                  className={`min-h-12 rounded-xl border px-2 text-xs font-semibold transition-colors ${
                    orderType === value
                      ? "border-primary bg-primary-surface text-primary"
                      : "border-border bg-surface text-text-secondary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {!availableOrderTypes.length && (
            <p className="text-xs text-danger">
              No order types are enabled for this branch. Ask a manager to
              update the branch settings.
            </p>
          )}

          {needsTable && tables && tables.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Select table
                </p>
                <span className="text-xs text-text-disabled">
                  {
                    tables.filter((table) => table.status === "AVAILABLE")
                      .length
                  }{" "}
                  available
                </span>
              </div>
              <input
                type="search"
                value={tableSearch}
                onChange={(event) => {
                  setTableSearch(event.target.value);
                  setVisibleTableCount(30);
                }}
                placeholder="Search table or section…"
                aria-label="Search tables"
                className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="scrollbar-hidden flex gap-1.5 overflow-x-auto">
                {["ALL", "AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING"].map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setTableStatusFilter(status);
                        setVisibleTableCount(30);
                      }}
                      className={`min-h-9 shrink-0 rounded-full border px-3 text-[11px] font-semibold ${
                        tableStatusFilter === status
                          ? "border-primary bg-primary-surface text-primary"
                          : "border-border bg-surface text-text-secondary"
                      }`}
                    >
                      {status === "ALL"
                        ? "All"
                        : status.charAt(0) + status.slice(1).toLowerCase()}
                    </button>
                  ),
                )}
              </div>
              <div
                className="scrollbar-hidden grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3"
                onScroll={(event) => {
                  const target = event.currentTarget;
                  if (
                    target.scrollHeight -
                      target.scrollTop -
                      target.clientHeight <
                    120
                  )
                    setVisibleTableCount((current) =>
                      Math.min(filteredTables.length, current + 30),
                    );
                }}
              >
                {filteredTables.slice(0, visibleTableCount).map((table) => {
                  const status = table.status ?? "AVAILABLE";
                  const available = status === "AVAILABLE";
                  const selected = table.id === tableId;
                  return (
                    <button
                      key={table.id}
                      type="button"
                      disabled={!available}
                      onClick={() => onTableChange(table.id)}
                      className={`min-h-20 rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
                        selected
                          ? "border-primary bg-primary-surface ring-1 ring-primary"
                          : "border-border bg-surface"
                      }`}
                    >
                      <span className="block truncate text-sm font-semibold text-text-primary">
                        {table.name}
                      </span>
                      <span className="mt-1 block truncate text-[11px] text-text-secondary">
                        {available
                          ? `${table.capacity} seats${table.section ? ` · ${table.section}` : ""}`
                          : status.charAt(0) + status.slice(1).toLowerCase()}
                      </span>
                    </button>
                  );
                })}
              </div>
              {!filteredTables.length && (
                <p className="rounded-xl bg-surface-secondary p-3 text-center text-xs text-text-secondary">
                  No tables match these filters.
                </p>
              )}
              {!tables.some((table) => table.status === "AVAILABLE") && (
                <p className="mt-2 rounded-xl bg-warning-surface p-3 text-xs text-warning">
                  No table is currently available. Reserved, occupied, and
                  cleaning tables cannot be selected.
                </p>
              )}
            </div>
          )}

          {needsTable && tables && tables.length === 0 && (
            <p className="rounded-xl bg-danger-surface p-3 text-xs text-danger">
              No tables are configured for this branch. Choose another service
              type or ask a manager to add tables.
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowAdvanced((value) => !value)}
            aria-expanded={showAdvanced}
            className="flex min-h-12 w-full items-center gap-2 rounded-xl border border-border px-3 text-left text-sm font-medium text-text-secondary"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Customer and billing
            {customerName && (
              <span className="ml-1 truncate text-xs text-primary">
                · {customerName}
              </span>
            )}
            <ChevronDown
              className={`ml-auto h-4 w-4 shrink-0 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
            />
          </button>

          {showAdvanced && (
            <div className="space-y-3 rounded-2xl bg-surface-secondary p-3">
              {customerId ? (
                <div className="flex min-h-11 items-center justify-between rounded-xl border border-primary-border bg-primary-surface px-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-primary">
                    <UserRound className="h-4 w-4" /> {customerName}
                  </span>
                  <button
                    type="button"
                    onClick={onClearCustomer}
                    aria-label="Remove customer"
                  >
                    <X className="h-4 w-4 text-primary" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search customer by name or phone…"
                    value={customerSearch}
                    onChange={(event) =>
                      onCustomerSearchChange(event.target.value)
                    }
                    aria-label="Search customer by name or phone"
                    className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {customerResults && customerResults.length > 0 && (
                    <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-36 overflow-y-auto rounded-xl border border-border bg-surface shadow-md">
                      {customerResults.map((customer) => (
                        <button
                          type="button"
                          key={customer.id}
                          onClick={() =>
                            onSelectCustomer(customer.id, customer.name)
                          }
                          className="w-full border-b border-divider px-4 py-2.5 text-left last:border-0"
                        >
                          <p className="text-sm font-medium text-text-primary">
                            {customer.name}
                          </p>
                          <p className="text-xs text-text-disabled">
                            {customer.phone || customer.email || "No contact"}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <SelectMenu
                  label="Customer group"
                  placeholder="No customer group"
                  value={customerGroupId || undefined}
                  onChange={onCustomerGroupChange}
                  className="min-h-11 rounded-xl"
                  options={[
                    { value: "", label: "No customer group" },
                    ...customerGroups.map((group) => ({
                      value: group.id,
                      label: group.name,
                    })),
                  ]}
                />
                <SelectMenu
                  label="Billing mode"
                  value={billingMode}
                  onChange={(value) =>
                    onBillingModeChange(value as "LINE_ITEMS" | "PER_COVER")
                  }
                  className="min-h-11 rounded-xl"
                  options={[
                    {
                      value: "LINE_ITEMS",
                      label: "Line items",
                      description: "Charge for ordered items",
                    },
                    {
                      value: "PER_COVER",
                      label: "Per cover",
                      description: "Charge by guest count",
                      disabled: !perCoverRules.length,
                    },
                  ]}
                />
              </div>

              {billingMode === "PER_COVER" && (
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs font-medium text-text-secondary">
                    Covers
                    <input
                      type="number"
                      min={1}
                      value={coverCount}
                      onChange={(event) =>
                        onCoverCountChange(
                          Math.max(1, Number(event.target.value) || 1),
                        )
                      }
                      className="mt-1 min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
                    />
                  </label>
                  <SelectMenu
                    label="Rate"
                    placeholder="Select a rate…"
                    value={perCoverPriceRuleId || undefined}
                    onChange={onPerCoverPriceRuleChange}
                    className="min-h-11 rounded-xl"
                    options={perCoverRules.map((rule) => ({
                      value: rule.id,
                      label: rule.coverTier ?? "Any cover",
                      description: `₹${Number(rule.price ?? 0).toFixed(2)}`,
                    }))}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};
