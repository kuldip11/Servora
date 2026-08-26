import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataGrid } from "../DataGrid";

type Row = { id: string; name: string; status: string };
const columns = [
  {
    id: "name",
    header: "Name",
    cell: (row: Row) => row.name,
    sortValue: (row: Row) => row.name,
    sortable: true,
  },
  { id: "status", header: "Status", cell: (row: Row) => row.status },
];
const data = [
  { id: "1", name: "Alice", status: "Paid" },
  { id: "2", name: "Bob", status: "Open" },
];

describe("DataGrid", () => {
  it("renders rows and supports sorting", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(
      <DataGrid<Row>
        columns={columns}
        data={data}
        getRowId={(row) => row.id}
        onSortChange={onSortChange}
      />,
    );
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeVisible();
    expect(screen.getByText("Alice")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Name" }));
    expect(onSortChange).toHaveBeenCalledWith({
      columnId: "name",
      direction: "asc",
    });
  });
  it("supports global filtering and row selection", async () => {
    const user = userEvent.setup();
    const onFilter = vi.fn();
    const onSelected = vi.fn();
    render(
      <DataGrid<Row>
        columns={columns}
        data={data}
        getRowId={(row) => row.id}
        selectable
        enableGlobalFilter
        onGlobalFilterChange={onFilter}
        getGlobalFilterValue={(row) => row.name}
        onSelectedIdsChange={onSelected}
      />,
    );
    await user.type(screen.getByRole("textbox", { name: /search/i }), "Alice");
    expect(onFilter).toHaveBeenLastCalledWith("Alice");
    await user.click(screen.getByRole("checkbox", { name: "Select row 1" }));
    expect(onSelected).toHaveBeenCalled();
  });
  it("renders the empty state when no rows exist", () => {
    render(
      <DataGrid<Row>
        columns={columns}
        data={[]}
        getRowId={(row) => row.id}
        emptyTitle="Nothing here"
      />,
    );
    expect(screen.getByText("Nothing here")).toBeVisible();
  });
});
