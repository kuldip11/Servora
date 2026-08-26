import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "../EmptyState";
import { Inbox } from "lucide-react";

describe("EmptyState", () => {
  it("renders title, description and action", () => {
    render(
      <EmptyState
        icon={Inbox}
        title="No orders"
        description="Nothing here yet"
        action={<button>Create</button>}
      />,
    );
    expect(screen.getByRole("heading", { name: "No orders" })).toBeVisible();
    expect(screen.getByText("Nothing here yet")).toBeVisible();
    expect(screen.getByRole("button", { name: "Create" })).toBeVisible();
  });
  it("supports the compact size", () => {
    const { container } = render(
      <EmptyState icon={Inbox} title="Empty" size="sm" />,
    );
    expect(container.firstElementChild).toHaveClass("py-10");
  });
});
