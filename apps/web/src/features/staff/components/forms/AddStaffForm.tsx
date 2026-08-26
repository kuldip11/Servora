import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStaffSchema, type CreateStaffInput } from "@pos/validation";
import { Button } from "@pos/ui";
import { StaffFormFields, type StaffBranchOption, type StaffRoleOption } from "./StaffFormFields";

interface Props {
  roles: StaffRoleOption[];
  branches: StaffBranchOption[];
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateStaffInput) => void;
}

export function AddStaffForm({ roles, branches, loading = false, onCancel, onSubmit }: Props) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateStaffInput>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", roleId: "", branchId: undefined },
  });

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-4">
      <StaffFormFields register={register} errors={errors} roleId={watch("roleId")} branchId={watch("branchId")} roles={roles} branches={branches} setValue={setValue} />
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>Add Staff</Button>
      </div>
    </form>
  );
}
