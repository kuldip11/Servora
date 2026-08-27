import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button, Card, Input, Modal, Select, StatusBadge } from "@pos/ui";
import { KeyRound, Plus, Shield, Trash2 } from "lucide-react";
import { rolesService, type Role } from "../../services/roles.service";
import { permissionsService, type Permission } from "../../services/permissions.service";
import { queryClient } from "../../../../shared/lib/query-client";
import { roleKeys } from "../../query-keys";
import { notifyError, notifySuccess } from "../../../../shared/lib/notify";

export function RoleManager({ roles, canManage, canManagePermissions }: { roles: Role[]; canManage: boolean; canManagePermissions: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<"TENANT" | "BRANCH">("BRANCH");
  const [permissionRole, setPermissionRole] = useState<Role | null>(null);
  const [catalog, setCatalog] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: roleKeys.list() });
  const createRole = useMutation({
    mutationFn: rolesService.create,
    onSuccess: () => { refresh(); notifySuccess("Role created"); setOpen(false); setName(""); setDescription(""); setScope("BRANCH"); },
    onError: (error) => notifyError(error, "Failed to create role"),
  });
  const archiveRole = useMutation({
    mutationFn: rolesService.archive,
    onSuccess: () => { refresh(); notifySuccess("Role archived"); },
    onError: (error) => notifyError(error, "Failed to archive role"),
  });
  const savePermissions = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => permissionsService.setForRole(roleId, permissionIds),
    onSuccess: () => { notifySuccess("Role permissions updated"); setPermissionRole(null); },
    onError: (error) => notifyError(error, "Failed to update permissions"),
  });

  useEffect(() => {
    if (!permissionRole) return;
    let active = true;
    setLoadingPermissions(true);
    Promise.all([permissionsService.list(), permissionsService.forRole(permissionRole.id)])
      .then(([all, assigned]) => {
        if (!active) return;
        setCatalog(all);
        setSelectedPermissionIds(assigned.map((permission) => permission.id));
      })
      .catch((error) => notifyError(error, "Failed to load permissions"))
      .finally(() => { if (active) setLoadingPermissions(false); });
    return () => { active = false; };
  }, [permissionRole]);

  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, Permission[]>();
    for (const permission of catalog) groups.set(permission.module, [...(groups.get(permission.module) ?? []), permission]);
    return [...groups.entries()];
  }, [catalog]);

  return (
    <Card className="mt-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Roles</h2>
            <p className="text-sm text-text-secondary">System roles and franchise-specific roles available to staff.</p>
          </div>
          {canManage && <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Create Role</Button>}
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <div key={role.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="font-medium text-text-primary">{role.name}</span>
                  <StatusBadge tone={role.scope === "BRANCH" ? "info" : "neutral"} dot={false} label={role.scope} />
                  {role.isSystem && <StatusBadge tone="neutral" dot={false} label="SYSTEM" />}
                </div>
                {role.description && <p className="mt-2 text-sm text-text-secondary">{role.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {canManagePermissions && !role.isSystem && (
                  <button type="button" className="rounded-md p-2 text-text-secondary hover:bg-primary-surface hover:text-primary" aria-label={`Manage permissions for ${role.name}`} onClick={() => setPermissionRole(role)}><KeyRound className="h-4 w-4" /></button>
                )}
                {canManage && !role.isSystem && (
                  <button type="button" className="rounded-md p-2 text-text-secondary hover:bg-danger-surface hover:text-danger" aria-label={`Archive ${role.name}`} onClick={() => { if (confirm(`Archive role ${role.name}?`)) archiveRole.mutate(role.id); }}><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create Role">
        <form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); createRole.mutate({ name, ...(description ? { description } : {}), scope }); }}>
          <Input label="Role name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} placeholder="e.g. Shift Lead" />
          <Input label="Description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} placeholder="What this role is responsible for" />
          <Select label="Scope" value={scope} onChange={(event) => setScope(event.target.value as "TENANT" | "BRANCH")} options={[{ value: "BRANCH", label: "Branch — assigned to selected branches" }, { value: "TENANT", label: "Franchise — access across the franchise" }]} />
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={createRole.isPending} disabled={!name.trim()}>Create Role</Button></div>
        </form>
      </Modal>

      <Modal open={Boolean(permissionRole)} onClose={() => setPermissionRole(null)} title={permissionRole ? `Permissions — ${permissionRole.name}` : "Permissions"}>
        <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1">
          {loadingPermissions ? <p className="text-sm text-text-secondary">Loading permissions…</p> : groupedPermissions.map(([module, permissions]) => (
            <fieldset key={module} className="rounded-lg border border-border p-3">
              <legend className="px-1 text-sm font-semibold capitalize text-text-primary">{module}</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {permissions.map((permission) => (
                  <label key={permission.id} className="flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-surface-secondary">
                    <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={selectedPermissionIds.includes(permission.id)} onChange={(event) => setSelectedPermissionIds((current) => event.target.checked ? [...current, permission.id] : current.filter((id) => id !== permission.id))} />
                    <span><span className="block text-sm font-medium text-text-primary">{permission.key}</span>{permission.description && <span className="block text-xs text-text-secondary">{permission.description}</span>}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="sticky bottom-0 flex justify-end gap-2 bg-surface pt-2"><Button variant="secondary" onClick={() => setPermissionRole(null)}>Cancel</Button><Button loading={savePermissions.isPending} disabled={!permissionRole || loadingPermissions} onClick={() => permissionRole && savePermissions.mutate({ roleId: permissionRole.id, permissionIds: selectedPermissionIds })}>Save Permissions</Button></div>
        </div>
      </Modal>
    </Card>
  );
}
