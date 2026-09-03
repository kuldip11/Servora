import { usePermissions } from "@/shared/auth/permissions";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tableFormSchema } from "@pos/validation";
import { appUrls } from "@/config/app-urls";
import {
  Plus,
  Table2,
  Users,
  Edit2,
  Trash2,
  MapPin,
  Building2,
  QrCode,
} from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Grid,
  IconButton,
  Input,
  Modal,
  Page,
  PageHeader,
  Select,
  SelectMenu,
  SearchInput,
  FilterBar,
  StatusBadge,
} from "@pos/ui";
import { useAuthStore } from "@/store/auth";
import { useBranches } from "@/features/branches/hooks/useBranches";
import { createTablesApi } from "@pos/api-client";
import { apiClient } from "@/shared/lib/api-client";

const tablesApi = createTablesApi(apiClient);
import { useTables } from "@/features/tables/hooks/useTables";
import { useTablesRealtimeSync } from "@/features/tables/hooks/useTablesRealtimeSync";
import { useCreateTable } from "@/features/tables/hooks/useCreateTable";
import { useUpdateTable } from "@/features/tables/hooks/useUpdateTable";
import { useUpdateTableStatus } from "@/features/tables/hooks/useUpdateTableStatus";
import { useDeleteTable } from "@/features/tables/hooks/useDeleteTable";
import { useRegenerateTableQr } from "@/features/tables/hooks/useRegenerateTableQr";
import { useOrders } from "@/features/orders/hooks/useOrders";
import { useTransferTable } from "@/features/orders/hooks/useTransferTable";
import { TableFormModal } from "@/features/tables/components/TableFormModal";
import type { TableFormValues } from "@/features/tables/table-form.types";
import type { RestaurantTable } from "@/features/tables/types";
import { QRCodeSVG } from "qrcode.react";
import { ordersService } from "@/features/orders/services/orders.service";
import { queryClient } from "@/shared/lib/query-client";
import { notifyError, notifySuccess } from "@/shared/lib/notify";

import {
  EMPTY_TABLE_FORM,
  TABLE_STATUS_CARD_BORDER,
  TABLE_STATUS_OPTIONS,
  TABLE_STATUS_TONES,
} from "@/features/tables/constants";

export const TablesPage = () => {
  const { has } = usePermissions();
  const { branchId } = useAuthStore();
  const isAggregate = branchId === "all";

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<RestaurantTable | null>(null);
  const [qrTable, setQrTable] = useState<RestaurantTable | null>(null);
  const [takeawayQrOpen, setTakeawayQrOpen] = useState(false);
  const [takeawayQr, setTakeawayQr] = useState<{
    branchId: string;
    branchName: string;
    enabled: boolean;
    token: string;
  } | null>(null);
  const [takeawayQrBusy, setTakeawayQrBusy] = useState(false);
  const [transferSource, setTransferSource] = useState<RestaurantTable | null>(
    null,
  );
  const [transferDestinationId, setTransferDestinationId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [mergeSource, setMergeSource] = useState<RestaurantTable | null>(null);
  const [mergeTargetOrderId, setMergeTargetOrderId] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TableFormValues>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: EMPTY_TABLE_FORM,
  });

  const { data: branches } = useBranches({ enabled: isAggregate });
  const { data: tables, isLoading } = useTables();
  const { data: openOrders = [] } = useOrders({ status: "OPEN", limit: 100 });
  useTablesRealtimeSync();

  const addMutation = useCreateTable();
  const updateMutation = useUpdateTable();
  const statusMutation = useUpdateTableStatus();
  const deleteMutation = useDeleteTable();
  const regenerateQrMutation = useRegenerateTableQr();
  const transferMutation = useTransferTable();
  const mergeMutation = useMutation({
    mutationFn: ({
      sourceOrderId,
      targetOrderId,
    }: {
      sourceOrderId: string;
      targetOrderId: string;
    }) => ordersService.mergeOrders(sourceOrderId, targetOrderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      notifySuccess("Tables merged for billing");
      setMergeSource(null);
      setMergeTargetOrderId("");
    },
    onError: (error) => notifyError(error, "Unable to merge tables"),
  });

  const statusCounts = useMemo(
    () =>
      (tables ?? []).reduce<Record<string, number>>((counts, table) => {
        counts[table.status] = (counts[table.status] ?? 0) + 1;
        return counts;
      }, {}),
    [tables],
  );
  const sections = useMemo(
    () =>
      [...new Set((tables ?? []).map((table) => table.section).filter(Boolean))]
        .sort()
        .map((section) => ({ value: section!, label: section! })),
    [tables],
  );
  const filteredTables = useMemo(() => {
    const search = tableSearch.trim().toLowerCase();
    return (tables ?? []).filter(
      (table) =>
        (!search ||
          `${table.name} ${table.section ?? ""} ${table.branch?.name ?? ""}`
            .toLowerCase()
            .includes(search)) &&
        (!statusFilter || table.status === statusFilter) &&
        (!sectionFilter || table.section === sectionFilter),
    );
  }, [sectionFilter, statusFilter, tableSearch, tables]);
  const hasTableFilters = Boolean(tableSearch || statusFilter || sectionFilter);

  const transferOrder = transferSource
    ? openOrders.find((order) => order.tableId === transferSource.id)
    : undefined;

  async function openTakeawayQr() {
    if (!branchId || branchId === "all") return;
    try {
      setTakeawayQrBusy(true);
      setTakeawayQr(await tablesApi.getTakeawayQr(branchId));
      setTakeawayQrOpen(true);
    } catch (error) {
      console.error("Unable to load takeaway QR", error);
    } finally {
      setTakeawayQrBusy(false);
    }
  }

  async function regenerateTakeawayQr() {
    if (!branchId || branchId === "all") return;
    try {
      setTakeawayQrBusy(true);
      setTakeawayQr(await tablesApi.regenerateTakeawayQr(branchId));
    } catch (error) {
      console.error("Unable to regenerate takeaway QR", error);
    } finally {
      setTakeawayQrBusy(false);
    }
  }

  function openAdd() {
    reset(EMPTY_TABLE_FORM);
    setShowAdd(true);
  }

  function closeAdd() {
    setShowAdd(false);
    reset(EMPTY_TABLE_FORM);
  }

  function openEdit(table: RestaurantTable) {
    setEditing(table);
    reset({
      name: table.name,
      capacity: String(table.capacity),
      section: table.section ?? "",
      branchId: "",
    });
  }

  function closeEdit() {
    setEditing(null);
    reset(EMPTY_TABLE_FORM);
  }

  function toPayload(values: TableFormValues) {
    return {
      name: values.name.trim(),
      capacity: Number(values.capacity),
      ...(values.section.trim() && { section: values.section.trim() }),
      ...(values.branchId && { branchId: values.branchId }),
    };
  }

  return (
    <Page>
      <PageHeader
        title="Tables"
        description={`${filteredTables.length} of ${tables?.length ?? 0} tables`}
        actions={
          <>
            {!isAggregate && (
              <Button
                variant="secondary"
                onClick={() => void openTakeawayQr()}
                disabled={takeawayQrBusy}
              >
                <QrCode className="w-4 h-4" />
                Takeaway QR
              </Button>
            )}
            {has("tables:create") && (
              <Button onClick={openAdd}>
                <Plus className="w-4 h-4" />
                Add Table
              </Button>
            )}
          </>
        }
      />

      <Card padding="sm">
        <FilterBar
          onClearAll={
            [tableSearch, statusFilter, sectionFilter].filter(Boolean).length >
            1
              ? () => {
                  setTableSearch("");
                  setStatusFilter("");
                  setSectionFilter("");
                }
              : undefined
          }
        >
          <SearchInput
            value={tableSearch}
            onChange={(event) => setTableSearch(event.target.value)}
            onClear={() => setTableSearch("")}
            placeholder="Search table or section"
            aria-label="Search tables"
            className="w-full sm:w-64"
          />
          <div className="flex max-w-full gap-1.5 overflow-x-auto py-0.5">
            <button
              type="button"
              onClick={() => setStatusFilter("")}
              className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold ${
                !statusFilter
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-text-secondary"
              }`}
            >
              All {tables?.length ?? 0}
            </button>
            {TABLE_STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold ${
                  statusFilter === option.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-text-secondary"
                }`}
              >
                {option.label} {statusCounts[option.value] ?? 0}
              </button>
            ))}
          </div>
          {sections.length > 1 && (
            <SelectMenu
              aria-label="Filter tables by section"
              valuePrefix="Section"
              placeholder="All sections"
              value={sectionFilter || undefined}
              options={[{ value: "", label: "All sections" }, ...sections]}
              onChange={(value) => setSectionFilter(value ?? "")}
              className="w-44"
            />
          )}
        </FilterBar>
      </Card>

      {isLoading ? (
        <Grid columns={{ base: 2, sm: 3, lg: 4 }} gap="md">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="h-40 animate-pulse" />
          ))}
        </Grid>
      ) : !filteredTables.length ? (
        <EmptyState
          icon={Table2}
          title={hasTableFilters ? "No matching tables" : "No tables yet"}
          description={
            hasTableFilters
              ? "Try a different status, section, or search term."
              : "Add the tables in your restaurant so waiters can assign dine-in orders to them."
          }
          action={
            has("tables:create") && (
              <Button onClick={openAdd}>
                <Plus className="w-4 h-4" /> Add Table
              </Button>
            )
          }
        />
      ) : isAggregate ? (
        Object.entries(
          filteredTables.reduce<Record<string, RestaurantTable[]>>(
            (acc, table) => {
              const key = table.branch?.name ?? "Unknown branch";
              (acc[key] ??= []).push(table);
              return acc;
            },
            {},
          ),
        ).map(([branchName, branchTables]) => (
          <div key={branchName} className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-text-disabled" />
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                {branchName}
              </p>
            </div>
            <TableGrid
              tables={branchTables}
              onEdit={openEdit}
              onDelete={(id, name) => {
                if (confirm(`Remove table "${name}"?`))
                  deleteMutation.mutate(id);
              }}
              onStatusChange={(id, status) =>
                statusMutation.mutate({ id, status })
              }
              onShowQr={setQrTable}
              onTransfer={has("orders:update") ? setTransferSource : undefined}
              onMerge={has("orders:update") ? setMergeSource : undefined}
            />
          </div>
        ))
      ) : (
        <TableGrid
          tables={filteredTables}
          onEdit={openEdit}
          onDelete={(id, name) => {
            if (confirm(`Remove table "${name}"?`)) deleteMutation.mutate(id);
          }}
          onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
          onShowQr={setQrTable}
          onTransfer={has("orders:update") ? setTransferSource : undefined}
          onMerge={has("orders:update") ? setMergeSource : undefined}
        />
      )}

      <TableFormModal
        mode="add"
        open={showAdd}
        editing={null}
        branches={branches ?? []}
        aggregate={isAggregate}
        errors={errors}
        register={register}
        handleSubmit={handleSubmit}
        pending={addMutation.isPending}
        onClose={closeAdd}
        onSubmit={(values) => {
          if (isAggregate && !values.branchId) {
            setError("branchId", { message: "Select a branch" });
            return;
          }
          addMutation.mutate(toPayload(values), { onSuccess: closeAdd });
        }}
      />
      <TableFormModal
        mode="edit"
        open={!!editing}
        editing={editing}
        branches={branches ?? []}
        aggregate={false}
        errors={errors}
        register={register}
        handleSubmit={handleSubmit}
        pending={updateMutation.isPending}
        onClose={closeEdit}
        onSubmit={(values) => {
          if (!editing) return;
          const payload = toPayload(values);
          updateMutation.mutate(
            {
              id: editing.id,
              input: {
                name: payload.name,
                capacity: payload.capacity,
                ...(payload.section && { section: payload.section }),
              },
            },
            { onSuccess: closeEdit },
          );
        }}
      />

      <TakeawayQrModal
        data={takeawayQr}
        open={takeawayQrOpen}
        onClose={() => setTakeawayQrOpen(false)}
        onRegenerate={() => void regenerateTakeawayQr()}
        busy={takeawayQrBusy}
      />

      <TableQrModal
        table={qrTable}
        open={!!qrTable}
        onClose={() => setQrTable(null)}
        onRegenerate={() => {
          if (!qrTable) return;
          regenerateQrMutation.mutate(qrTable.id, {
            onSuccess: (updated) => setQrTable(updated),
          });
        }}
        regenerating={regenerateQrMutation.isPending}
      />
      <Modal
        open={!!transferSource}
        onClose={() => setTransferSource(null)}
        title={`Transfer ${transferSource?.name ?? "table"}`}
      >
        <div className="space-y-4">
          <label className="block text-sm font-medium text-text-primary">
            Destination
            <select
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
              value={transferDestinationId}
              onChange={(event) => setTransferDestinationId(event.target.value)}
            >
              <option value="">Select an available table</option>
              {(tables ?? [])
                .filter(
                  (table) =>
                    table.status === "AVAILABLE" &&
                    table.branchId === transferSource?.branchId,
                )
                .map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.name}
                  </option>
                ))}
            </select>
          </label>
          <Input
            label="Reason (optional)"
            value={transferReason}
            onChange={(event) => setTransferReason(event.target.value)}
          />
          {!transferOrder && (
            <p className="text-sm text-danger">
              No open order was found for this table.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setTransferSource(null)}>
              Cancel
            </Button>
            <Button
              disabled={!transferOrder || !transferDestinationId}
              loading={transferMutation.isPending}
              onClick={() => {
                if (!transferOrder) return;
                transferMutation.mutate(
                  {
                    orderId: transferOrder.id,
                    newTableId: transferDestinationId,
                    reason: transferReason,
                  },
                  {
                    onSuccess: () => {
                      setTransferSource(null);
                      setTransferDestinationId("");
                      setTransferReason("");
                    },
                  },
                );
              }}
            >
              Transfer
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        open={!!mergeSource}
        onClose={() => setMergeSource(null)}
        title={`Merge ${mergeSource?.name ?? "table"}`}
      >
        <div className="space-y-4">
          <label className="block text-sm font-medium text-text-primary">
            Merge billing into
            <select
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
              value={mergeTargetOrderId}
              onChange={(event) => setMergeTargetOrderId(event.target.value)}
            >
              <option value="">Select another occupied table</option>
              {openOrders
                .filter(
                  (order) =>
                    order.tableId !== mergeSource?.id &&
                    !order.mergedIntoOrderId,
                )
                .map((order) => {
                  const table = (tables ?? []).find(
                    (candidate) => candidate.id === order.tableId,
                  );
                  return (
                    <option key={order.id} value={order.id}>
                      {table?.name ?? `Order ${order.id.slice(-8)}`}
                    </option>
                  );
                })}
            </select>
          </label>
          <p className="text-xs text-text-secondary">
            Kitchen tickets remain separate. The orders will share one combined
            bill.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setMergeSource(null)}>
              Cancel
            </Button>
            <Button
              disabled={!mergeTargetOrderId}
              loading={mergeMutation.isPending}
              onClick={() => {
                const source = openOrders.find(
                  (order) => order.tableId === mergeSource?.id,
                );
                if (source)
                  mergeMutation.mutate({
                    sourceOrderId: source.id,
                    targetOrderId: mergeTargetOrderId,
                  });
              }}
            >
              Merge tables
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
};

function TableGrid({
  tables,
  onEdit,
  onDelete,
  onStatusChange,
  onShowQr,
  onTransfer,
  onMerge,
}: {
  tables: RestaurantTable[];
  onEdit: (table: RestaurantTable) => void;
  onDelete: (id: string, name: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onShowQr: (table: RestaurantTable) => void;
  onTransfer?: ((table: RestaurantTable) => void) | undefined;
  onMerge?: ((table: RestaurantTable) => void) | undefined;
}) {
  const [visibleCount, setVisibleCount] = useState(32);
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => setVisibleCount(32), [tables]);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || visibleCount >= tables.length) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting)
          setVisibleCount((current) => Math.min(tables.length, current + 32));
      },
      { rootMargin: "320px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [tables.length, visibleCount]);
  const visibleTables = tables.slice(0, visibleCount);
  return (
    <>
      <Grid columns={{ base: 2, sm: 3, lg: 4 }} gap="md">
        {visibleTables.map((table) => (
          <Card
            key={table.id}
            className={`border-2 flex flex-col gap-3 ${TABLE_STATUS_CARD_BORDER[table.status]}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-surface-secondary flex items-center justify-center">
                  <Table2 className="w-4.5 h-4.5 text-text-secondary" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">
                    {table.name}
                  </p>
                  <p className="text-xs text-text-secondary flex items-center gap-1">
                    <Users className="w-3 h-3" /> {table.capacity}
                    {table.section && (
                      <>
                        <span className="mx-0.5">·</span>
                        <MapPin className="w-3 h-3" /> {table.section}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <IconButton
                  icon={QrCode}
                  size="sm"
                  aria-label="Show table QR code"
                  title="Show table QR code"
                  onClick={() => onShowQr(table)}
                />
                <IconButton
                  icon={Edit2}
                  size="sm"
                  aria-label="Edit table"
                  title="Edit table"
                  onClick={() => onEdit(table)}
                />
                <IconButton
                  icon={Trash2}
                  size="sm"
                  aria-label={
                    table.status === "OCCUPIED"
                      ? "Has an active order"
                      : "Remove table"
                  }
                  title={
                    table.status === "OCCUPIED"
                      ? "Has an active order"
                      : "Remove table"
                  }
                  disabled={table.status === "OCCUPIED"}
                  onClick={() => onDelete(table.id, table.name)}
                />
              </div>
            </div>

            <StatusBadge
              tone={TABLE_STATUS_TONES[table.status]}
              label={
                table.status.charAt(0) + table.status.slice(1).toLowerCase()
              }
              className="w-fit"
            />

            <Select
              options={TABLE_STATUS_OPTIONS}
              value={table.status}
              onChange={(e) => onStatusChange(table.id, e.target.value)}
              disabled={table.status === "OCCUPIED"}
              className="text-xs py-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            {table.status === "OCCUPIED" && (
              <div className="space-y-2 -mt-1">
                <p className="text-[11px] text-text-disabled">
                  Has an active order — frees up automatically once it's closed.
                </p>
                {onTransfer && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onTransfer(table)}
                  >
                    Transfer
                  </Button>
                )}
                {onMerge && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onMerge(table)}
                  >
                    Merge
                  </Button>
                )}
              </div>
            )}
          </Card>
        ))}
      </Grid>
      {visibleCount < tables.length && (
        <div
          ref={sentinelRef}
          className="py-5 text-center text-xs text-text-secondary"
        >
          Loading more tables…
        </div>
      )}
    </>
  );
}

function TakeawayQrModal({
  data,
  open,
  onClose,
  onRegenerate,
  busy,
}: {
  data: {
    branchId: string;
    branchName: string;
    enabled: boolean;
    token: string;
  } | null;
  open: boolean;
  onClose: () => void;
  onRegenerate: () => void;
  busy: boolean;
}) {
  if (!data) return null;
  const customerAppUrl = appUrls.customer;
  const url = `${customerAppUrl.replace(/\/$/, "")}/?qr=${encodeURIComponent(data.token)}`;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${data.branchName} — Takeaway QR`}
      size="sm"
      description="A public ordering QR for takeaway customers. It is not linked to a physical table."
      footer={
        <>
          <Button variant="secondary" onClick={onRegenerate} disabled={busy}>
            {busy ? "Updating…" : "Regenerate"}
          </Button>
          <Button onClick={() => window.print()} disabled={!data.enabled}>
            Print QR
          </Button>
        </>
      }
    >
      {!data.enabled ? (
        <div className="rounded-lg border border-warning bg-warning-surface p-4 text-sm text-warning">
          Takeaway ordering is disabled for this branch. Enable Takeaway in
          branch settings before publishing this QR.
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm print:shadow-none">
            <QRCodeSVG value={url} size={240} level="M" includeMargin />
          </div>
          <div>
            <p className="font-semibold text-text-primary">
              Scan to order takeaway
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Customers can order without selecting a table.
            </p>
          </div>
          <div className="w-full rounded-lg bg-surface-secondary p-3 text-left">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-disabled">
              Customer URL
            </p>
            <p className="mt-1 break-all text-xs text-text-secondary">{url}</p>
          </div>
        </div>
      )}
    </Modal>
  );
}

function TableQrModal({
  table,
  open,
  onClose,
  onRegenerate,
  regenerating,
}: {
  table: RestaurantTable | null;
  open: boolean;
  onClose: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  if (!table) return null;
  const customerAppUrl = appUrls.customer;
  const url = `${customerAppUrl.replace(/\/$/, "")}/?qr=${encodeURIComponent(table.publicQrToken)}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${table.name} — Customer QR`}
      size="sm"
      description="Scan this QR code to open the Servora customer self-ordering menu for this table."
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onRegenerate}
            disabled={regenerating}
          >
            {regenerating ? "Regenerating…" : "Regenerate"}
          </Button>
          <Button onClick={() => window.print()}>Print QR</Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm print:shadow-none">
          <QRCodeSVG value={url} size={240} level="M" includeMargin />
        </div>
        <div>
          <p className="font-semibold text-text-primary">
            Scan to order from your table
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {table.section ? `${table.section} · ` : ""}
            {table.name} · {table.capacity} seats
          </p>
        </div>
        <div className="w-full rounded-lg bg-surface-secondary p-3 text-left">
          <p className="text-[11px] font-medium uppercase tracking-wide text-text-disabled">
            Customer URL
          </p>
          <p className="mt-1 break-all text-xs text-text-secondary">{url}</p>
        </div>
      </div>
    </Modal>
  );
}
