import { usePermissions } from "../../../shared/auth/permissions";
import { useState } from "react";
import { Plus, Users, Trash2, UserCheck, UserX, Pencil } from "lucide-react";
import {
  Button,
  Card,
  Modal,
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
import { AddStaffForm } from "../components/forms/AddStaffForm";
import { EditStaffForm } from "../components/forms/EditStaffForm";
import { RoleManager } from "../components/roles/RoleManager";

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

export function StaffPage() {
  const { has } = usePermissions();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<StaffRow | null>(null);

  const { data: staff, isLoading } = useStaff();
  const { data: rolesData } = useRoles();
  const { data: branches } = useBranches();

  const addMutation = useAddStaff();
  const deleteMutation = useDeleteStaff();
  const updateStatusMutation = useUpdateStaffStatus();
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: {
        firstName: string;
        lastName: string;
        roleId: string;
        branchIds: string[];
      };
    }) => staffService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.list() });
      notifySuccess("Staff member updated");
      setEditing(null);
    },
    onError: (err) => notifyError(err, "Failed to update staff"),
  });

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
          {member.assignedBranches
            ?.map((branch) => branch.name)
            .filter(Boolean)
            .join(", ") || "—"}
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

      <RoleManager
        roles={rolesData ?? []}
        canManage={has("roles:create")}
        canManagePermissions={has("roles:assign_permissions")}
      />

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Staff Member"
      >
        <AddStaffForm
          roles={rolesData ?? []}
          branches={branches ?? []}
          loading={addMutation.isPending}
          onCancel={() => setShowAdd(false)}
          onSubmit={(values) =>
            addMutation.mutate(values, { onSuccess: () => setShowAdd(false) })
          }
        />
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
            onSubmit={(input) =>
              updateMutation.mutate({ id: editing.id, input })
            }
            loading={updateMutation.isPending}
          />
        )}
      </Modal>
    </Page>
  );
}
