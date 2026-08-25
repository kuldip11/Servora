import { usePermissions } from "../../../shared/auth/permissions";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { branchFormSchema, type BranchFormValues } from "@pos/validation";
import { Plus, Building2 } from "lucide-react";
import { Button, EmptyState, Page, PageHeader, Grid } from "@pos/ui";
import type { Branch } from "@pos/types";
import { useBranches } from "../hooks/useBranches";
import { useCreateBranch } from "../hooks/useCreateBranch";
import { useUpdateBranch } from "../hooks/useUpdateBranch";
import { useDeactivateBranch } from "../hooks/useDeactivateBranch";
import { BranchCard } from "../components/BranchCard";
import { BranchFormModal } from "../components/BranchFormModal";

const emptyForm: BranchFormValues = {
  name: "",
  address: "",
  phone: "",
  dineInEnabled: true,
  takeawayEnabled: true,
  deliveryEnabled: true,
  onlineEnabled: true,
  tablesEnabled: true,
};

export function BranchesPage() {
  const { has } = usePermissions();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: emptyForm,
  });
  const form = watch();

  const { data: branches, isLoading } = useBranches();
  const addMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();
  const deactivateMutation = useDeactivateBranch();

  function openEdit(branch: Branch) {
    setEditing(branch);
    reset({
      name: branch.name,
      address: branch.address ?? "",
      phone: branch.phone ?? "",
      dineInEnabled: branch.dineInEnabled,
      takeawayEnabled: branch.takeawayEnabled,
      deliveryEnabled: branch.deliveryEnabled,
      onlineEnabled: branch.onlineEnabled,
      tablesEnabled: branch.tablesEnabled,
    });
  }

  // Dine-in and tables are presented as one combined toggle in the form —
  // dine-in without tables is unusual, tables without dine-in doesn't make
  // sense, so we avoid letting an owner create that mismatched state here.
  return (
    <Page>
      <PageHeader
        title="Branches"
        description={`${branches?.length ?? 0} branch${branches?.length === 1 ? "" : "es"} — each has its own menu, tables, staff, and orders`}
        actions={
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" />
            Add Branch
          </Button>
        }
      />

      {isLoading ? (
        <Grid columns={{ base: 1, sm: 2, lg: 3 }} gap="md">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-lg bg-surface-secondary"
            />
          ))}
        </Grid>
      ) : !branches?.length ? (
        <EmptyState
          icon={Building2}
          title="No branches yet"
          description="Add your first branch to start setting up its menu, tables, and staff."
          action={
            has("branch:create") && (
              <Button onClick={() => setShowAdd(true)}>
                <Plus className="w-4 h-4" /> Add Branch
              </Button>
            )
          }
        />
      ) : (
        <Grid columns={{ base: 1, sm: 2, lg: 3 }} gap="md">
          {branches.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              onEdit={openEdit}
              onDeactivate={(b) => {
                if (
                  confirm(
                    `Deactivate "${b.name}"? Its data stays intact but it'll stop showing up as an active location.`,
                  )
                )
                  deactivateMutation.mutate(b.id);
              }}
            />
          ))}
        </Grid>
      )}

      <BranchFormModal
        mode="add"
        open={showAdd}
        form={form}
        errors={errors}
        register={register}
        setValue={setValue}
        handleSubmit={handleSubmit}
        pending={addMutation.isPending}
        onClose={() => {
          setShowAdd(false);
          reset(emptyForm);
        }}
        onSubmit={(values) =>
          addMutation.mutate(values, {
            onSuccess: () => {
              setShowAdd(false);
              reset(emptyForm);
            },
          })
        }
      />
      <BranchFormModal
        mode="edit"
        open={!!editing}
        form={form}
        errors={errors}
        register={register}
        setValue={setValue}
        handleSubmit={handleSubmit}
        pending={updateMutation.isPending}
        onClose={() => {
          setEditing(null);
          reset(emptyForm);
        }}
        onSubmit={(values) => {
          if (editing)
            updateMutation.mutate(
              { id: editing.id, input: values },
              {
                onSuccess: () => {
                  setEditing(null);
                  reset(emptyForm);
                },
              },
            );
        }}
      />
    </Page>
  );
}
