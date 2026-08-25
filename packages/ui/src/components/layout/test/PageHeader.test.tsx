import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "../PageHeader";

describe("PageHeader", () => {
  it("renders title, description, eyebrow and actions", () => {
    render(
      <PageHeader
        title="Orders"
        description="Manage orders"
        eyebrow="Sales"
        actions={<button>New</button>}
      />,
    );
    expect(screen.getByRole("heading", { name: "Orders" })).toBeVisible();
    expect(screen.getByText("Manage orders")).toBeVisible();
    expect(screen.getByText("Sales")).toBeVisible();
    expect(screen.getByRole("button", { name: "New" })).toBeVisible();
  });
});
