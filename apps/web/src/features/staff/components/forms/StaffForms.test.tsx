import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AddStaffForm } from "./AddStaffForm";
import { EditStaffForm } from "./EditStaffForm";

vi.mock("@pos/ui", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Input: ({ label, ...props }: any) => <label>{label}<input {...props} /></label>,
  Select: ({ label, options, ...props }: any) => <label>{label}<select {...props}>{options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>,
}));

describe("Staff forms", () => {
  const roles = [
    { id: "r1", name: "WAITER", scope: "BRANCH" },
    { id: "r2", name: "MANAGER", scope: "TENANT" },
  ];
  const branches = [{ id: "b1", name: "Main" }];

  it("keeps create form separate and auto-selects the only branch for branch roles", async () => {
    const onSubmit = vi.fn();
    render(<AddStaffForm roles={roles} branches={branches} onCancel={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "r1" } });
    expect(screen.getByLabelText("Branch")).toHaveValue("b1");
  });

  it("submits create form values through its public callback", () => {
    const onSubmit = vi.fn();
    render(<AddStaffForm roles={roles} branches={branches} onCancel={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.input(screen.getByLabelText("First name"), { target: { value: "Jane" } });
    fireEvent.input(screen.getByLabelText("Last name"), { target: { value: "Doe" } });
    fireEvent.input(screen.getByLabelText("Email"), { target: { value: "jane@example.com" } });
    fireEvent.input(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "r1" } });
    fireEvent.submit(screen.getByRole("button", { name: "Add Staff" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ firstName: "Jane", lastName: "Doe", roleId: "r1", branchId: "b1" }));
  });

  it("renders edit form independently and submits branchIds", () => {
    const onSubmit = vi.fn();
    render(<EditStaffForm member={{ id: "m1", firstName: "John", lastName: "Doe", roles: [{ name: "WAITER" }], assignedBranches: [{ id: "b1" }] }} roles={roles} branches={branches} onCancel={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.submit(screen.getByRole("button", { name: "Save changes" }));

    expect(onSubmit).toHaveBeenCalledWith({ firstName: "John", lastName: "Doe", roleId: "r1", branchIds: ["b1"] });
  });
});
