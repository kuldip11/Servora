import { usePermissions } from "../../../shared/auth/permissions";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createInventoryItemSchema,
  updateInventoryStockSchema,
  type CreateInventoryItemInput,
  type UpdateInventoryStockInput,
} from "@pos/validation";
import { Plus, AlertTriangle, Package, Building2, History } from "lucide-react";
import {
  Button,
  Card,
  Modal,
  Input,
  Select,
  StatCard,
  StatusBadge,
  Badge,
  Page,
  PageHeader,
  Grid,
  Table,
  type Column,
} from "@pos/ui";
import { formatCurrency } from "../../../shared/utils";
import { useAuthStore } from "../../../store/auth";
import { useBranches } from "../../branches/hooks/useBranches";
import { useInventoryItems } from "../hooks/useInventoryItems";
import { useAddInventoryItem } from "../hooks/useAddInventoryItem";
import { useUpdateInventoryStock } from "../hooks/useUpdateInventoryStock";
import { useInventoryRealtimeSync } from "../hooks/useInventoryRealtimeSync";
import { useInventoryTransactions } from "../hooks/useInventoryTransactions";
import { useWasteReasons } from "../hooks/useWasteReasons";
import { useInventoryRecipeImpact } from "../hooks/useInventoryRecipeImpact";
import { useCreateWasteReason, useLogInventoryWaste } from "../hooks/useLogInventoryWaste";
import type { InventoryItem } from "@pos/types";

const UNIT_OPTIONS = [
  { value: "KG", label: "Kilograms (KG)" },
  { value: "GRAMS", label: "Grams (g)" },
  { value: "LITERS", label: "Liters (L)" },
  { value: "ML", label: "Milliliters (ml)" },
  { value: "PIECES", label: "Pieces" },
  { value: "PACKETS", label: "Packets" },
];

const TRANSACTION_OPTIONS = [
  { value: "IN", label: "Stock In" },
  { value: "OUT", label: "Stock Out" },
  { value: "ADJUSTMENT", label: "Adjustment" },
];

export function InventoryPage() {
  const { has } = usePermissions();
  const { branchId } = useAuthStore();
  const isAggregate = branchId === "all";

  const [showAdd, setShowAdd] = useState(false);
  const [showUpdate, setShowUpdate] = useState<InventoryItem | null>(null);
  const [showWaste, setShowWaste] = useState<InventoryItem | null>(null);
  const [showImpact, setShowImpact] = useState<InventoryItem | null>(null);
  const [wasteQuantity, setWasteQuantity] = useState("1");
  const [wasteReasonId, setWasteReasonId] = useState("");
  const [newWasteReason, setNewWasteReason] = useState("");
  const [wasteNotes, setWasteNotes] = useState("");
  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    formState: { errors: addErrors },
  } = useForm<CreateInventoryItemInput>({
    resolver: zodResolver(createInventoryItemSchema),
    defaultValues: {
      name: "",
      unit: "KG",
      currentStock: 0,
      minimumStock: 0,
      reorderPoint: 0,
      costPerUnit: 0,
      branchId: undefined,
    },
  });
  const {
    register: registerStock,
    handleSubmit: handleSubmitStock,
    reset: resetStock,
    formState: { errors: stockErrors },
  } = useForm<UpdateInventoryStockInput>({
    resolver: zodResolver(updateInventoryStockSchema),
    defaultValues: { quantity: 0, transactionType: "IN", notes: "" },
  });

  // Same unscoped ('all') branch list the switcher and Staff page use —
  // shares cache with them instead of a duplicate ad-hoc query.
  const { data: branches } = useBranches({ enabled: isAggregate });

  const { data: items, isLoading } = useInventoryItems();
  const { data: transactions } = useInventoryTransactions();
  const { data: wasteReasons } = useWasteReasons();
  const { data: recipeImpact, isLoading: recipeImpactLoading } =
    useInventoryRecipeImpact(showImpact?.id);
  useInventoryRealtimeSync();

  const addMutation = useAddInventoryItem();
  const updateStockMutation = useUpdateInventoryStock();
  const logWasteMutation = useLogInventoryWaste();
  const createWasteReasonMutation = useCreateWasteReason();

  function handleAdd(values: CreateInventoryItemInput) {
    addMutation.mutate(
      {
        ...values,
        currentStock: String(values.currentStock),
        minimumStock: String(values.minimumStock),
        reorderPoint: String(values.reorderPoint),
        costPerUnit: String(values.costPerUnit),
        ...(values.branchId ? { branchId: values.branchId } : {}),
      },
      {
        onSuccess: () => {
          setShowAdd(false);
          resetAdd({
            name: "",
            unit: "KG",
            currentStock: 0,
            minimumStock: 0,
            reorderPoint: 0,
            costPerUnit: 0,
            branchId: undefined,
          });
        },
      },
    );
  }

  function handleUpdateStock(values: UpdateInventoryStockInput) {
    if (!showUpdate) return;
    updateStockMutation.mutate(
      {
        itemId: showUpdate.id,
        input: {
          ...values,
          quantity: String(values.quantity),
          notes: values.notes ?? "",
        },
      },
      {
        onSuccess: () => {
          setShowUpdate(null);
          resetStock({ quantity: 0, transactionType: "IN", notes: "" });
        },
      },
    );
  }

  const lowStock = items?.filter(
    (i) =>
      parseFloat(String(i.currentStock)) <= parseFloat(String(i.minimumStock)),
  );

  const groupedByBranch = isAggregate
    ? Object.entries(
        (items ?? []).reduce<Record<string, InventoryItem[]>>((acc, item) => {
          const key = item.branch?.name ?? "Unknown branch";
          (acc[key] ??= []).push(item);
          return acc;
        }, {}),
      )
    : null;

  return (
    <Page>
      <PageHeader
        title="Inventory"
        description={`${items?.length ?? 0} items tracked`}
        actions={
          has("inventory:create") && (
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          )
        }
      />

      <Grid columns={{ base: 2, lg: 4 }} gap="md">
        <StatCard
          title="Total Items"
          value={items?.length ?? 0}
          icon={Package}
          color="violet"
        />
        <StatCard
          title="Low Stock"
          value={lowStock?.length ?? 0}
          icon={AlertTriangle}
          color={lowStock?.length ? "red" : "emerald"}
        />
      </Grid>

      {!!lowStock?.length && (
        <Card padding="md" className="bg-danger-surface border-danger/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-danger" />
            <p className="text-sm font-semibold text-danger">
              Low Stock Alerts ({lowStock.length})
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((item) => (
              <Badge key={item.id} variant="danger">
                {isAggregate && item.branch ? `${item.branch.name} · ` : ""}
                {item.name} — {parseFloat(String(item.currentStock))}{" "}
                {item.unit}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {isAggregate && groupedByBranch ? (
        <Card padding="none" className="overflow-hidden">
          {groupedByBranch.map(([branchName, branchItems], idx) => (
            <div
              key={branchName}
              className={idx > 0 ? "border-t border-border" : undefined}
            >
              <div className="px-4 py-2.5 bg-surface-secondary flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-text-disabled" />
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  {branchName}
                </p>
              </div>
              <InventoryTable
                items={branchItems}
                loading={isLoading}
                onUpdateStock={setShowUpdate}
                onLogWaste={setShowWaste}
                onViewImpact={setShowImpact}
              />
            </div>
          ))}
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <InventoryTable
            items={items ?? []}
            loading={isLoading}
            onUpdateStock={setShowUpdate}
            onLogWaste={setShowWaste}
            onViewImpact={setShowImpact}
            onAddItem={() => setShowAdd(true)}
          />
        </Card>
      )}

      <Card padding="md">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <History className="h-4 w-4" /> Recent stock activity
            </h2>
            <p className="mt-1 text-xs text-text-secondary">
              Latest restocks, usage, waste and corrections in the current
              scope.
            </p>
          </div>
          <Badge>{transactions?.length ?? 0} changes</Badge>
        </div>
        {!transactions?.length ? (
          <p className="py-6 text-center text-sm text-text-disabled">
            No stock changes recorded yet
          </p>
        ) : (
          <div className="divide-y divide-border">
            {transactions.slice(0, 12).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center gap-3 py-3 text-sm"
              >
                <StatusBadge
                  label={transaction.reversalOfDeductionId ? "VOID REVERSAL" : transaction.transactionType.replace("_", " ")}
                  tone={
                    transaction.transactionType === "IN"
                      ? "success"
                      : transaction.transactionType === "WASTE"
                        ? "danger"
                        : "neutral"
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text-primary">
                    {transaction.inventoryItem?.name ?? "Inventory item"}
                  </p>
                  <p className="truncate text-xs text-text-secondary">
                    {transaction.wasteReason?.label ? `${transaction.wasteReason.label}${transaction.notes ? ` · ${transaction.notes}` : ""}` : transaction.notes || "No note"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-text-primary">
                    {transaction.quantity}{" "}
                    {transaction.inventoryItem?.unit ?? ""}
                  </p>
                  <p className="text-xs text-text-disabled">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Item Modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Inventory Item"
      >
        <form onSubmit={handleSubmitAdd(handleAdd)} className="space-y-4">
          <Input
            label="Item name"
            placeholder="e.g. Chicken Breast"
            error={addErrors.name?.message}
            {...registerAdd("name")}
          />
          <Select
            label="Unit"
            options={UNIT_OPTIONS}
            error={addErrors.unit?.message}
            {...registerAdd("unit")}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Current Stock"
              type="number"
              min="0"
              step="0.001"
              error={addErrors.currentStock?.message}
              {...registerAdd("currentStock", { valueAsNumber: true })}
            />
            <Input
              label="Minimum Stock"
              type="number"
              min="0"
              step="0.001"
              error={addErrors.minimumStock?.message}
              {...registerAdd("minimumStock", { valueAsNumber: true })}
            />
            <Input
              label="Reorder Point"
              type="number"
              min="0"
              step="0.001"
              error={addErrors.reorderPoint?.message}
              {...registerAdd("reorderPoint", { valueAsNumber: true })}
            />
            <Input
              label="Cost per Unit (₹)"
              type="number"
              min="0"
              step="0.01"
              error={addErrors.costPerUnit?.message}
              {...registerAdd("costPerUnit", { valueAsNumber: true })}
            />
          </div>
          {isAggregate && (
            <Select
              label="Branch"
              options={[
                { value: "", label: "Select branch" },
                ...(branches?.map((b) => ({ value: b.id, label: b.name })) ??
                  []),
              ]}
              error={addErrors.branchId?.message}
              {...registerAdd("branchId")}
            />
          )}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAdd(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={addMutation.isPending}>
              Add Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Stock Modal */}
      <Modal
        open={!!showUpdate}
        onClose={() => setShowUpdate(null)}
        title={`Update Stock: ${showUpdate?.name}`}
        size="sm"
      >
        <form
          onSubmit={handleSubmitStock(handleUpdateStock)}
          className="space-y-4"
        >
          <Select
            label="Transaction Type"
            options={TRANSACTION_OPTIONS}
            error={stockErrors.transactionType?.message}
            {...registerStock("transactionType")}
          />
          <Input
            label="Quantity"
            type="number"
            min="0.001"
            step="0.001"
            error={stockErrors.quantity?.message}
            hint={`Current stock: ${parseFloat(String(showUpdate?.currentStock ?? 0)).toFixed(2)} ${showUpdate?.unit}`}
            {...registerStock("quantity", { valueAsNumber: true })}
          />
          <Input
            label="Notes (optional)"
            placeholder="Reason for update..."
            error={stockErrors.notes?.message}
            {...registerStock("notes")}
          />
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowUpdate(null)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={updateStockMutation.isPending}>
              Update
            </Button>
          </div>
        </form>
      </Modal>


      <Modal
        open={!!showImpact}
        onClose={() => setShowImpact(null)}
        title={`Recipe impact: ${showImpact?.name ?? "Inventory item"}`}
        size="sm"
      >
        {recipeImpactLoading ? (
          <p className="py-6 text-center text-sm text-text-secondary">Loading recipe impact…</p>
        ) : !recipeImpact?.impacts.length ? (
          <p className="py-6 text-center text-sm text-text-secondary">
            This ingredient is not currently a required auto-deduction input for any menu item, variant, or modifier.
          </p>
        ) : (
          <div className="space-y-2">
            {recipeImpact.impacts.map((impact) => (
              <div key={`${impact.kind}:${impact.entityId}`} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {impact.kind === "ITEM" ? impact.entityName : `${impact.menuItemName} · ${impact.entityName}`}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {impact.kind === "ITEM" ? "Base item" : impact.kind === "VARIANT" ? "Variant" : "Modifier option"}
                  </p>
                </div>
                <StatusBadge
                  tone={impact.computedAvailable ? "success" : "danger"}
                  label={impact.computedAvailable ? "Available" : "Auto 86"}
                />
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal open={!!showWaste} onClose={() => setShowWaste(null)} title={`Log Waste: ${showWaste?.name}`} size="sm">
        <div className="space-y-4">
          <Input label="Quantity wasted" type="number" min="0.001" step="0.001" value={wasteQuantity} onChange={(e) => setWasteQuantity(e.target.value)} hint={`Current stock: ${parseFloat(String(showWaste?.currentStock ?? 0)).toFixed(2)} ${showWaste?.unit ?? ""}`} />
          <Select label="Waste reason" value={wasteReasonId} onChange={(e) => setWasteReasonId(e.target.value)} options={[{ value: "", label: "Select reason" }, ...(wasteReasons ?? []).map((reason) => ({ value: reason.id, label: reason.label }))]} />
          <div className="rounded-md border border-border p-3">
            <p className="mb-2 text-xs font-medium text-text-secondary">Need a new reason?</p>
            <div className="flex gap-2"><Input aria-label="New waste reason" value={newWasteReason} onChange={(e) => setNewWasteReason(e.target.value)} placeholder="e.g. Prep trim" /><Button type="button" size="sm" variant="secondary" disabled={!newWasteReason.trim() || createWasteReasonMutation.isPending} onClick={() => createWasteReasonMutation.mutate(newWasteReason.trim(), { onSuccess: (reason) => { setWasteReasonId(reason.id); setNewWasteReason(""); } })}>Add</Button></div>
          </div>
          <Input label="Notes (optional)" value={wasteNotes} onChange={(e) => setWasteNotes(e.target.value)} />
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowWaste(null)}>Cancel</Button><Button disabled={!wasteReasonId || !(Number(wasteQuantity) > 0)} loading={logWasteMutation.isPending} onClick={() => { if (!showWaste) return; logWasteMutation.mutate({ itemId: showWaste.id, quantity: Number(wasteQuantity), wasteReasonId, ...(wasteNotes ? { notes: wasteNotes } : {}) }, { onSuccess: () => { setShowWaste(null); setWasteQuantity("1"); setWasteReasonId(""); setWasteNotes(""); } }); }}>Log Waste</Button></div>
        </div>
      </Modal>
    </Page>
  );
}

function InventoryTable({
  items,
  loading,
  onUpdateStock,
  onLogWaste,
  onViewImpact,
  onAddItem,
}: {
  items: InventoryItem[];
  loading: boolean;
  onUpdateStock: (item: InventoryItem) => void;
  onLogWaste: (item: InventoryItem) => void;
  onViewImpact: (item: InventoryItem) => void;
  onAddItem?: () => void;
}) {
  const columns: Column<InventoryItem>[] = [
    {
      id: "name",
      header: "Item",
      cell: (item) => (
        <span className="font-medium text-text-primary">{item.name}</span>
      ),
      sortable: true,
      sortValue: (item) => item.name,
    },
    {
      id: "unit",
      header: "Unit",
      cell: (item) => <span className="text-text-secondary">{item.unit}</span>,
    },
    {
      id: "currentStock",
      header: "Current Stock",
      sortable: true,
      sortValue: (item) => parseFloat(String(item.currentStock)),
      cell: (item) => {
        const current = parseFloat(String(item.currentStock));
        const minimum = parseFloat(String(item.minimumStock));
        const isLow = current <= minimum;
        return (
          <span
            className={
              isLow
                ? "font-semibold text-danger"
                : "font-semibold text-text-primary"
            }
          >
            {current.toFixed(2)}
          </span>
        );
      },
    },
    {
      id: "minimumStock",
      header: "Min Stock",
      cell: (item) => (
        <span className="text-text-secondary">
          {parseFloat(String(item.minimumStock)).toFixed(2)}
        </span>
      ),
    },
    {
      id: "costPerUnit",
      header: "Cost/Unit",
      cell: (item) => (
        <span className="text-text-primary">
          {formatCurrency(parseFloat(String(item.costPerUnit)))}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (item) => {
        const current = parseFloat(String(item.currentStock));
        const minimum = parseFloat(String(item.minimumStock));
        const isLow = current <= minimum;
        return isLow ? (
          <StatusBadge tone="danger" label="Low Stock" />
        ) : (
          <StatusBadge tone="success" label="In Stock" />
        );
      },
    },
    {
      id: "actions",
      header: "",
      align: "right",
      cell: (item) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => onViewImpact(item)}>Recipe Impact</Button>
          <Button size="sm" variant="secondary" onClick={() => onLogWaste(item)}>Log Waste</Button>
          <Button size="sm" variant="secondary" onClick={() => onUpdateStock(item)}>Update Stock</Button>
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={items}
      getRowId={(item) => item.id}
      loading={loading}
      emptyIcon={Package}
      emptyTitle="No inventory items"
      emptyDescription="Start tracking your ingredients and supplies."
      emptyAction={
        onAddItem ? (
          <Button onClick={onAddItem}>
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        ) : undefined
      }
    />
  );
}
