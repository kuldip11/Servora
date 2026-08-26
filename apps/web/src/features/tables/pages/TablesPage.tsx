import { usePermissions } from "../../../shared/auth/permissions";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tableFormSchema } from "@pos/validation";
import type { z } from "zod";
import {
  Plus,
  Table2,
  Users,
  Edit2,
  Trash2,
  MapPin,
  Building2,
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
  StatusBadge,
  type StatusTone,
} from "@pos/ui";
import { useAuthStore } from "../../../store/auth";
import { useBranches } from "../../branches/hooks/useBranches";
import { useTables } from "../hooks/useTables";
import { useTablesRealtimeSync } from "../hooks/useTablesRealtimeSync";
import { useCreateTable } from "../hooks/useCreateTable";
import { useUpdateTable } from "../hooks/useUpdateTable";
import { useUpdateTableStatus } from "../hooks/useUpdateTableStatus";
import { useDeleteTable } from "../hooks/useDeleteTable";
import { TableFormModal } from "../components/TableFormModal";
import type { RestaurantTable } from "../types";

const STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Available" },
  { value: "OCCUPIED", label: "Occupied" },
  { value: "CLEANING", label: "Cleaning" },
  { value: "RESERVED", label: "Reserved" },
];

const STATUS_TONES: Record<RestaurantTable["status"], StatusTone> = {
  AVAILABLE: "success",
  OCCUPIED: "danger",
  CLEANING: "info",
  RESERVED: "warning",
};

const STATUS_CARD_BORDER: Record<RestaurantTable["status"], string> = {
  AVAILABLE: "border-emerald-200",
  OCCUPIED: "border-red-200",
  CLEANING: "border-blue-200",
  RESERVED: "border-amber-200",
};

export type TableFormValues = z.input<typeof tableFormSchema>;

const emptyForm: TableFormValues = {
  name: "",
  capacity: "4",
  section: "",
  branchId: "",
};

export function TablesPage() {
  const { has } = usePermissions();
  const { branchId } = useAuthStore();
  const isAggregate = branchId === "all";

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<RestaurantTable | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TableFormValues>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: emptyForm,
  });

  const { data: branches } = useBranches({ enabled: isAggregate });
  const { data: tables, isLoading } = useTables();
  useTablesRealtimeSync();

  const addMutation = useCreateTable();
  const updateMutation = useUpdateTable();
  const statusMutation = useUpdateTableStatus();
  const deleteMutation = useDeleteTable();

  function openAdd() {
    reset(emptyForm);
    setShowAdd(true);
  }

  function closeAdd() {
    setShowAdd(false);
    reset(emptyForm);
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
    reset(emptyForm);
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
        description={`${tables?.length ?? 0} tables`}
        actions={
          has("tables:create") && (
            <Button onClick={openAdd}>
              <Plus className="w-4 h-4" />
              Add Table
            </Button>
          )
        }
      />

      {isLoading ? (
        <Grid columns={{ base: 2, sm: 3, lg: 4 }} gap="md">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="h-40 animate-pulse" />
          ))}
        </Grid>
      ) : !tables?.length ? (
        <EmptyState
          icon={Table2}
          title="No tables yet"
          description="Add the tables in your restaurant so waiters can assign dine-in orders to them."
          action={
            has("tables:create") && (
              <Button onClick={openAdd}>
                <Plus className="w-4 h-4" /> Add Table
              </Button>
            )
          }
        />
      ) : isAggregate ? (
        // Grouped per branch — a "Table 5" at Branch A and "Table 5" at
        // Branch B are different physical tables, so no flat merged pool.
        Object.entries(
          tables.reduce<Record<string, RestaurantTable[]>>((acc, table) => {
            const key = table.branch?.name ?? "Unknown branch";
            (acc[key] ??= []).push(table);
            return acc;
          }, {}),
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
            />
          </div>
        ))
      ) : (
        <TableGrid
          tables={tables}
          onEdit={openEdit}
          onDelete={(id, name) => {
            if (confirm(`Remove table "${name}"?`)) deleteMutation.mutate(id);
          }}
          onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
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
    </Page>
  );
}

function TableGrid({
  tables,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  tables: RestaurantTable[];
  onEdit: (table: RestaurantTable) => void;
  onDelete: (id: string, name: string) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <Grid columns={{ base: 2, sm: 3, lg: 4 }} gap="md">
      {tables.map((table) => (
        <Card
          key={table.id}
          className={`border-2 flex flex-col gap-3 ${STATUS_CARD_BORDER[table.status]}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-surface-secondary flex items-center justify-center">
                <Table2 className="w-4.5 h-4.5 text-text-secondary" />
              </div>
              <div>
                <p className="font-semibold text-text-primary">{table.name}</p>
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
            tone={STATUS_TONES[table.status]}
            label={table.status.charAt(0) + table.status.slice(1).toLowerCase()}
            className="w-fit"
          />

          <Select
            options={STATUS_OPTIONS}
            value={table.status}
            onChange={(e) => onStatusChange(table.id, e.target.value)}
            disabled={table.status === "OCCUPIED"}
            className="text-xs py-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          />
          {table.status === "OCCUPIED" && (
            <p className="text-[11px] text-text-disabled -mt-1">
              Has an active order — frees up automatically once it's closed.
            </p>
          )}
        </Card>
      ))}
    </Grid>
  );
}
