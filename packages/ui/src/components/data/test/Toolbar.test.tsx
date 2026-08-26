import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Toolbar } from "../Toolbar";

describe("Toolbar", () => {
  it("renders title, subtitle and actions", () => {
    render(
      <Toolbar
        title="Orders"
        subtitle="Today"
        actions={<button>Add</button>}
      />,
    );
    expect(screen.getByText("Orders")).toBeVisible();
    expect(screen.getByText("Today")).toBeVisible();
    expect(screen.getByRole("button", { name: "Add" })).toBeVisible();
  });
});
