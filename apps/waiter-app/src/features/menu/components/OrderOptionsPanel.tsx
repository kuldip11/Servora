import { X, Table2, UserCircle } from "lucide-react";
import { ALL_ORDER_TYPES } from "../constants";
import type { LoyaltyCustomer, RestaurantTable } from "@pos/types";

interface Props {
  availableOrderTypes: typeof ALL_ORDER_TYPES;
  orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  onOrderTypeChange: (type: "DINE_IN" | "TAKEAWAY" | "DELIVERY") => void;
  tablesEnabled: boolean;
  tables: RestaurantTable[] | undefined;
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
  perCoverRules: Array<{ id: string; coverTier?: "ADULT" | "CHILD" | null; price: string | number | null }>;
  perCoverPriceRuleId: string;
  onPerCoverPriceRuleChange: (id: string) => void;
}

// Order context controls for fulfillment type, table, customer, and billing.
export function OrderOptionsPanel({
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
}: Props) {
  return (
    <div className="bg-surface border-b border-border px-4 py-3 space-y-3">
      {/* Type toggle */}
      <div className="flex gap-2">
        {availableOrderTypes.map(({ value: t, label }) => (
          <button
            key={t}
            onClick={() => onOrderTypeChange(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
              orderType === t
                ? "bg-primary text-primary-foreground"
                : "bg-surface-secondary text-text-secondary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {!availableOrderTypes.length && (
        <p className="text-xs text-danger">
          No order types are enabled for this branch — ask a manager to check
          the Branches page.
        </p>
      )}

      {/* Table */}
      {orderType === "DINE_IN" &&
        tablesEnabled &&
        tables &&
        tables.length > 0 && (
          <div className="flex items-center gap-2">
            <Table2 className="w-4 h-4 text-text-disabled flex-shrink-0" />
            <select
              aria-label="Select table"
              value={tableId}
              onChange={(e) => onTableChange(e.target.value)}
              className="flex-1 text-sm border border-border rounded-xl px-3 py-2 bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a table…</option>
              {tables
                .filter((t) => t.status === "AVAILABLE")
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} · {t.capacity} seats
                  </option>
                ))}
            </select>
          </div>
        )}
      {orderType === "DINE_IN" &&
        tablesEnabled &&
        tables &&
        tables.length > 0 &&
        !tables.some((t) => t.status === "AVAILABLE") && (
          <p className="text-xs text-danger -mt-1">
            No tables are free right now — you'll need one to become available
            before placing this order.
          </p>
        )}
      {orderType === "DINE_IN" &&
        tablesEnabled &&
        tables &&
        tables.length === 0 && (
          <p className="text-xs text-danger -mt-1">
            No tables have been set up yet — ask a manager to add tables first.
          </p>
        )}

      {/* Customer */}
      <div className="flex items-center gap-2">
        <UserCircle className="w-4 h-4 text-text-disabled flex-shrink-0" />
        {customerId ? (
          <div className="flex-1 flex items-center justify-between bg-primary-surface border border-primary-border rounded-xl px-3 py-2">
            <span className="text-sm font-medium text-primary">
              {customerName}
            </span>
            <button onClick={onClearCustomer} aria-label="Remove customer">
              <X className="w-4 h-4 text-primary" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search customer by name or phone…"
              value={customerSearch}
              onChange={(e) => onCustomerSearchChange(e.target.value)}
              aria-label="Search customer by name or phone"
              className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {customerResults && customerResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-surface border border-border rounded-xl shadow-md mt-1 z-20 max-h-36 overflow-y-auto">
                {customerResults.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onSelectCustomer(c.id, c.name)}
                    className="w-full text-left px-4 py-2.5 hover:bg-primary-surface border-b border-divider last:border-0"
                  >
                    <p className="text-sm font-medium text-text-primary">
                      {c.name}
                    </p>
                    <p className="text-xs text-text-disabled">
                      {c.phone || c.email || "No contact"}{c.loyaltyTier?.name ? ` · ${c.loyaltyTier.name}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Explicit group-pricing context and buffet billing mode. */}
      <div className="grid gap-2 md:grid-cols-2">
        <label className="text-xs font-medium text-text-secondary">
          Customer group pricing
          <select
            className="mt-1 w-full rounded-xl border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary"
            value={customerGroupId}
            onChange={(event) => onCustomerGroupChange(event.target.value)}
          >
            <option value="">No customer group</option>
            {customerGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-text-secondary">
          Billing mode
          <select
            className="mt-1 w-full rounded-xl border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary"
            value={billingMode}
            onChange={(event) => onBillingModeChange(event.target.value as "LINE_ITEMS" | "PER_COVER")}
          >
            <option value="LINE_ITEMS">Line items</option>
            <option value="PER_COVER" disabled={!perCoverRules.length}>Per cover / buffet</option>
          </select>
        </label>
      </div>
      {billingMode === "PER_COVER" && (
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-primary-border bg-primary-surface p-3">
          <label className="text-xs font-medium text-text-secondary">
            Covers
            <input
              type="number" min={1} step={1}
              value={coverCount}
              onChange={(event) => onCoverCountChange(Math.max(1, Number(event.target.value) || 1))}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-text-secondary">
            Per-cover rate
            <select
              value={perCoverPriceRuleId}
              onChange={(event) => onPerCoverPriceRuleChange(event.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="">Select a rate…</option>
              {perCoverRules.map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.coverTier ? `${rule.coverTier.charAt(0)}${rule.coverTier.slice(1).toLowerCase()} cover` : "Any cover"} · ₹{Number(rule.price ?? 0).toFixed(2)}
                </option>
              ))}
            </select>
          </label>
          <p className="col-span-2 text-xs text-text-secondary">Items still fire to the kitchen and consume inventory; billing is cover-based.</p>
        </div>
      )}
    </div>
  );
}