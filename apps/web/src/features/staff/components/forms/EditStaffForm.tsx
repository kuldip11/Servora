import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button, Input, Select } from "@pos/ui";
import type { StaffBranchOption, StaffRoleOption } from "./StaffFormFields";

export interface EditableStaff {
  id: string;
  firstName?: string;
  lastName?: string;
  roles?: { name?: string }[];
  assignedBranches?: { id?: string }[];
}

interface Props {
  member: EditableStaff;
  roles: StaffRoleOption[];
  branches: StaffBranchOption[];
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (input: { firstName: string; lastName: string; roleId: string; branchIds: string[] }) => void;
}

type Values = { firstName: string; lastName: string; roleId: string; branchIds: string[] };

export function EditStaffForm({ member, roles, branches, loading = false, onCancel, onSubmit }: Props) {
  const { register, handleSubmit, watch, setValue } = useForm<Values>({
    defaultValues: {
      firstName: member.firstName ?? "",
      lastName: member.lastName ?? "",
      roleId: roles.find((role) => role.name === member.roles?.[0]?.name)?.id ?? "",
      branchIds: member.assignedBranches?.map((branch) => branch.id).filter(Boolean) as string[] ?? [],
    },
  });
  const roleId = watch("roleId");
  const branchIds = watch("branchIds");
  const branchRequired = roles.find((role) => role.id === roleId)?.scope === "BRANCH";

  useEffect(() => {
    if (branchRequired && branchIds.length === 0 && branches.length === 1) setValue("branchIds", [branches[0]!.id]);
    if (!branchRequired && branchIds.length) setValue("branchIds", []);
  }, [branchRequired, branchIds.length, branches, setValue]);

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="First name" {...register("firstName", { required: true })} />
        <Input label="Last name" {...register("lastName", { required: true })} />
      </div>
      <Select label="Role" options={[{ value: "", label: "Select role" }, ...roles.filter((role) => role.name !== "OWNER").map((role) => ({ value: role.id, label: role.name }))]} {...register("roleId", { required: true })} />
      {branchRequired && (
        <Select label="Branch" options={[{ value: "", label: "Select branch" }, ...branches.map((branch) => ({ value: branch.id, label: branch.name }))]} value={branchIds[0] ?? ""} onChange={(event) => setValue("branchIds", event.target.value ? [event.target.value] : [])} />
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>Save changes</Button>
      </div>
    </form>
  );
}
