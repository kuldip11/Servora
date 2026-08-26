import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TopNav } from "../TopNav";

describe("TopNav", () => {
  it("renders brand, navigation items and actions", () => {
    render(
      <TopNav
        brand={<span>POS</span>}
        items={[{ label: "Orders", href: "/orders" }]}
        actions={<button>Help</button>}
      />,
    );
    expect(screen.getByText("POS")).toBeVisible();
    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute(
      "href",
      "/orders",
    );
    expect(screen.getByRole("button", { name: "Help" })).toBeVisible();
  });
});
