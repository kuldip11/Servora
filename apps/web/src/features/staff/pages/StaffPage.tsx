import { usePermissions } from "../../../shared/auth/permissions";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStaffSchema, type CreateStaffInput } from "@pos/validation";
import { Plus, Users, Trash2, UserCheck, UserX, Pencil } from "lucide-react";
import {
  Button,
  Card,
  Modal,
  Input,
  Select,
  IconButton,
  StatusBadge,
  Page,
  PageHeader,
  Table,
  type Column,
  type StatusTone,
} from "@pos/ui";
import { useBranches } from "../../branches/hooks/useBranches";
import { useStaff } from "../hooks/useStaff";
import { useRoles } from "../hooks/useRoles";
import { useAddStaff } from "../hooks/useAddStaff";
import { useDeleteStaff } from "../hooks/useDeleteStaff";
import { useUpdateStaffStatus } from "../hooks/useUpdateStaffStatus";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError, notifySuccess } from "../../../shared/lib/notify";
import { staffService } from "../services/staff.service";
import { staffKeys } from "../query-keys";

// The staff service returns `any[]` (see `staff.service.ts` — never
// typed, not something this render-only migration changes). This local
// shape covers only the fields this page actually reads, so `Table`'s
// columns get real types without inventing a `@pos/types` export that
// isn't backed by an actual typed API response.
interface StaffRow {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  status: string;
  assignedBranches?: { id?: string; name?: string }[];
  roles?: { name?: string; scope?: string }[];
}

const STATUS_TONES: Record<string, StatusTone> = {
  ACTIVE: "success",
  INACTIVE: "neutral",
  SUSPENDED: "danger",
};

function EditStaffForm({
  member,
  roles,
  branches,
  onCancel,
  onSubmit,
  loading,
}: {
  member: StaffRow;
  roles: Array<{ id: string; name: string; scope: string }>;
  branches: Array<{ id: string; name: string }>;
  onCancel: () => void;
  onSubmit: (input: { firstName: string; lastName: string; roleId: string; branchIds: string[] }) => void;
  loading: boolean;
}) {
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      firstName: member.firstName ?? "",
      lastName: member.lastName ?? "",
      roleId: roles.find((role) => role.name === member.roles?.[0]?.name)?.id ?? "",
      branchIds: member.assignedBranches?.map((branch) => branch.id!).filter(Boolean) ?? [],
    },
  });
  const roleId = watch("roleId");
  const role = roles.find((item) => item.id === roleId);
  const branchRequired = role?.scope === "BRANCH";
  const branchIds = watch("branchIds");

  useEffect(() => {
    if (branchRequired && branchIds.length === 0 && branches.length === 1) {
      setValue("branchIds", [branches[0]!.id]);
    }
    if (!branchRequired) setValue("branchIds", []);
  }, [branchRequired, branchIds.length, branches, setValue]);

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(values))}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <Input label="First name" {...register("firstName", { required: true })} />
        <Input label="Last name" {...register("lastName", { required: true })} />
      </div>
      <Select
        label="Role"
        options={[{ value: "", label: "Select role" }, ...roles.filter((role) => role.name !== "OWNER").map((role) => ({ value: role.id, label: role.name }))]}
        {...register("roleId", { required: true })}
      />
      {branchRequired && (
        <Select
          label="Branch"
          options={[{ value: "", label: "Select branch" }, ...branches.map((branch) => ({ value: branch.id, label: branch.name }))]}
          value={branchIds[0] ?? ""}
          onChange={(event) => setValue("branchIds", event.target.value ? [event.target.value] : [])}
        />
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>Save changes</Button>
      </div>
    </form>
  );
}

export function StaffPage() {
  const { has } = usePermissions();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateStaffInput>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      roleId: "",
      branchId: undefined,
    },
  });

  const { data: staff, isLoading } = useStaff();
  const { data: rolesData } = useRoles();
  const { data: branches } = useBranches();
  const selectedRoleId = watch("roleId");
  const selectedRole = rolesData?.find((role) => role.id === selectedRoleId);
  const showBranchPicker = selectedRole?.scope === "BRANCH" && (branches?.length ?? 0) > 0;

  useEffect(() => {
    if (selectedRole?.scope !== "BRANCH") {
      setValue("branchId", undefined);
      return;
    }
    if (!watch("branchId") && branches?.length === 1) {
      setValue("branchId", branches[0]!.id, { shouldValidate: true });
    }
  }, [selectedRole?.scope, branches, setValue, watch]);

  const roleSelectOptions = [
    { value: "", label: "Select role" },
    ...(rolesData
      ?.filter((r) => r.name !== "OWNER")
      .map((r) => ({ value: r.id, label: r.name })) ?? []),
  ];

  const branchSelectOptions = [
    { value: "", label: "Select branch" },
    ...(branches?.map((b) => ({ value: b.id, label: b.name })) ?? []),
  ];

  const addMutation = useAddStaff();
  const deleteMutation = useDeleteStaff();
  const updateStatusMutation = useUpdateStaffStatus();
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { firstName: string; lastName: string; roleId: string; branchIds: string[] } }) =>
      staffService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.list() });
      notifySuccess("Staff member updated");
      setEditing(null);
    },
    onError: (err) => notifyError(err, "Failed to update staff"),
  });

  function handleAdd(values: CreateStaffInput) {
    addMutation.mutate(
      values,
      {
        onSuccess: () => {
          setShowAdd(false);
          reset({
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            roleId: "",
            branchId: undefined,
          });
        },
      },
    );
  }

  const columns: Column<StaffRow>[] = [
    {
      id: "name",
      header: "Name",
      sortable: true,
      sortValue: (member) =>
        `${member.firstName ?? ""} ${member.lastName ?? ""}`,
      cell: (member) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-surface rounded-full flex items-center justify-center text-xs font-semibold text-primary">
            {member.firstName?.[0]}
            {member.lastName?.[0]}
          </div>
          <span className="font-medium text-text-primary">
            {member.firstName} {member.lastName}
          </span>
        </div>
      ),
    },
    {
      id: "email",
      header: "Email",
      cell: (member) => (
        <span className="text-text-secondary">{member.email}</span>
      ),
    },
    {
      id: "branch",
      header: "Branch",
      cell: (member: StaffRow) => (
        <span className="text-text-secondary">
          {member.assignedBranches?.map((branch) => branch.name).filter(Boolean).join(", ") || "—"}
        </span>
      ),
    },
    {
      id: "role",
      header: "Role",
      cell: (member) =>
        member.roles?.[0]?.name ? (
          <StatusBadge tone="info" dot={false} label={member.roles[0].name} />
        ) : null,
    },
    {
      id: "status",
      header: "Status",
      cell: (member) => (
        <StatusBadge
          tone={STATUS_TONES[member.status] ?? "neutral"}
          label={member.status}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      align: "right",
      cell: (member) => (
        <div className="flex items-center justify-end gap-1">
          {has("staff:update") && (
            <IconButton
              icon={Pencil}
              size="sm"
              aria-label="Edit staff member"
              title="Edit staff member"
              onClick={() => setEditing(member)}
            />
          )}
          {has("staff:update") &&
            (member.status === "ACTIVE" ? (
              <IconButton
                icon={UserX}
                size="sm"
                aria-label="Deactivate"
                title="Deactivate"
                onClick={() =>
                  updateStatusMutation.mutate({
                    id: member.id,
                    status: "INACTIVE",
                  })
                }
              />
            ) : (
              <IconButton
                icon={UserCheck}
                size="sm"
                aria-label="Activate"
                title="Activate"
                onClick={() =>
                  updateStatusMutation.mutate({
                    id: member.id,
                    status: "ACTIVE",
                  })
                }
              />
            ))}
          {has("staff:deactivate") && (
            <IconButton
              icon={Trash2}
              size="sm"
              aria-label="Remove staff member"
              onClick={() => {
                if (confirm("Remove this staff member?"))
                  deleteMutation.mutate(member.id);
              }}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <Page>
      <PageHeader
        title="Staff"
        description={`${staff?.length ?? 0} team members`}
        actions={
          has("staff:create") && (
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" />
              Add Staff
            </Button>
          )
        }
      />

      <Card padding="none" className="overflow-hidden">
        <Table
          columns={columns}
          data={staff ?? []}
          getRowId={(member) => member.id}
          loading={isLoading}
          emptyIcon={Users}
          emptyTitle="No staff members"
          emptyDescription="Add your team to get started."
          emptyAction={
            has("staff:create") && (
              <Button onClick={() => setShowAdd(true)}>
                <Plus className="w-4 h-4" /> Add Staff
              </Button>
            )
          }
        />
      </Card>

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Staff Member"
      >
        <form onSubmit={handleSubmit(handleAdd)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              placeholder="John"
              error={errors.firstName?.message}
              {...register("firstName")}
            />
            <Input
              label="Last name"
              placeholder="Doe"
              error={errors.lastName?.message}
              {...register("lastName")}
            />
          </div>
          <Input
            label="Email"
            type="email"
            placeholder="staff@restaurant.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            error={errors.password?.message}
            {...register("password")}
          />
          <Select
            label="Role"
            options={roleSelectOptions}
            error={errors.roleId?.message}
            {...register("roleId")}
          />
          {showBranchPicker && (
            <Select
              label="Branch"
              options={branchSelectOptions}
              error={errors.branchId?.message}
              {...register("branchId")}
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
              Add Staff
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit Staff Member"
      >
        {editing && (
          <EditStaffForm
            member={editing}
            roles={rolesData ?? []}
            branches={branches ?? []}
            onCancel={() => setEditing(null)}
            onSubmit={(input) => updateMutation.mutate({ id: editing.id, input })}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>
    </Page>
  );
}
