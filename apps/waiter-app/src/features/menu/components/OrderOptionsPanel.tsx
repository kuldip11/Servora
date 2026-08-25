import { X, Table2, UserCircle } from 'lucide-react';
import { ALL_ORDER_TYPES } from '../constants';

interface Props {
  availableOrderTypes: typeof ALL_ORDER_TYPES;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  onOrderTypeChange: (type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY') => void;
  tablesEnabled: boolean;
  tables: any[] | undefined;
  tableId: string;
  onTableChange: (id: string) => void;
  customerId: string;
  customerName: string;
  onClearCustomer: () => void;
  customerSearch: string;
  onCustomerSearchChange: (value: string) => void;
  customerResults: any[] | undefined;
  onSelectCustomer: (id: string, name: string) => void;
}

// Design-system Phase 11, Sprint WA-3 — retokenized only, on purpose.
// This owns the 1 Waiter App instance of the audit's native-`<select>`
// finding (`phase-0-ui-audit.md` §3: "7 instances in Admin, 1 in
// Waiter App"). It's **not** migrated onto `SelectMenu` here — Phase
// 4's own write-up flags that swap as a genuine interaction-model
// change (Popover-backed `onChange(value)` vs. a native `<select>`'s
// DOM-event API), needing a deliberate re-test per call site, not
// something to fold silently into a token-migration pass; that's still
// an open, unsigned-off decision covering all 13 call sites (12 in
// Admin, this one), not decided unilaterally here. Same reasoning
// applies to the customer-search dropdown below, which is functionally
// what `Autocomplete` (Phase 4) was built for (async search + a
// results list) — introducing that component here would be the same
// kind of interaction-shape change, so it stays hand-rolled, just
// retokenized.
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
}: Props) {
  return (
    <div className="bg-surface border-b border-border px-4 py-3 space-y-3">
      {/* Type toggle */}
      <div className="flex gap-2">
        {availableOrderTypes.map(({ value: t, label }) => (
          <button key={t} onClick={() => onOrderTypeChange(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
              orderType === t ? 'bg-primary text-primary-foreground' : 'bg-surface-secondary text-text-secondary'
            }`}>
            {label}
          </button>
        ))}
      </div>
      {!availableOrderTypes.length && (
        <p className="text-xs text-danger">No order types are enabled for this branch — ask a manager to check the Branches page.</p>
      )}

      {/* Table */}
      {orderType === 'DINE_IN' && tablesEnabled && tables && tables.length > 0 && (
        <div className="flex items-center gap-2">
          <Table2 className="w-4 h-4 text-text-disabled flex-shrink-0" />
          <select aria-label="Select table" value={tableId} onChange={(e) => onTableChange(e.target.value)}
            className="flex-1 text-sm border border-border rounded-xl px-3 py-2 bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Select a table…</option>
            {tables.filter((t: any) => t.status === 'AVAILABLE').map((t: any) => (
              <option key={t.id} value={t.id}>{t.name} · {t.capacity} seats</option>
            ))}
          </select>
        </div>
      )}
      {orderType === 'DINE_IN' && tablesEnabled && tables && tables.length > 0 &&
        !tables.some((t: any) => t.status === 'AVAILABLE') && (
        <p className="text-xs text-danger -mt-1">No tables are free right now — you'll need one to become available before placing this order.</p>
      )}
      {orderType === 'DINE_IN' && tablesEnabled && tables && tables.length === 0 && (
        <p className="text-xs text-danger -mt-1">No tables have been set up yet — ask a manager to add tables first.</p>
      )}

      {/* Customer */}
      <div className="flex items-center gap-2">
        <UserCircle className="w-4 h-4 text-text-disabled flex-shrink-0" />
        {customerId ? (
          <div className="flex-1 flex items-center justify-between bg-primary-surface border border-primary-border rounded-xl px-3 py-2">
            <span className="text-sm font-medium text-primary">{customerName}</span>
            <button onClick={onClearCustomer} aria-label="Remove customer">
              <X className="w-4 h-4 text-primary" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="flex-1 relative">
            <input type="text" placeholder="Search customer by name or phone…"
              value={customerSearch}
              onChange={(e) => onCustomerSearchChange(e.target.value)}
              aria-label="Search customer by name or phone"
              className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary" />
            {customerResults && customerResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-surface border border-border rounded-xl shadow-md mt-1 z-20 max-h-36 overflow-y-auto">
                {customerResults.map((c: any) => (
                  <button key={c.id} onClick={() => onSelectCustomer(c.id, c.name)}
                    className="w-full text-left px-4 py-2.5 hover:bg-primary-surface border-b border-divider last:border-0">
                    <p className="text-sm font-medium text-text-primary">{c.name}</p>
                    <p className="text-xs text-text-disabled">{c.phone} · {c.loyaltyPoints} pts</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
