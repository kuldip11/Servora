import type {
  FieldErrors,
  UseFormRegister,
  UseFormHandleSubmit,
} from "react-hook-form";
import { Button, Modal, Input, Select } from "@pos/ui";
import type { Branch } from "@pos/types";
import type { RestaurantTable } from "../types";
import type { TableFormValues } from "../pages/TablesPage";

export function TableFormModal({
  mode,
  open,
  editing,
  branches,
  aggregate,
  errors,
  register,
  handleSubmit,
  pending,
  onClose,
  onSubmit,
}: {
  mode: "add" | "edit";
  open: boolean;
  editing: RestaurantTable | null;
  branches: Branch[];
  aggregate: boolean;
  errors: FieldErrors<TableFormValues>;
  register: UseFormRegister<TableFormValues>;
  handleSubmit: UseFormHandleSubmit<TableFormValues>;
  pending: boolean;
  onClose: () => void;
  onSubmit: (values: TableFormValues) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "add" ? "Add Table" : "Edit Table"}
    >
      <form className="space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Table name"
          placeholder="T-01"
          error={errors.name?.message}
          {...register("name")}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Capacity"
            type="number"
            min={1}
            error={errors.capacity?.message}
            {...register("capacity")}
          />
          <Input
            label="Section (optional)"
            placeholder="Patio, Main hall…"
            error={errors.section?.message}
            {...register("section")}
          />
        </div>
        {mode === "add" && aggregate && (
          <Select
            label="Branch"
            options={[
              { value: "", label: "Select branch" },
              ...branches.map((b) => ({ value: b.id, label: b.name })),
            ]}
            {...(errors.branchId?.message
              ? { error: errors.branchId.message }
              : {})}
            {...register("branchId")}
          />
        )}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {mode === "add" ? "Add Table" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
