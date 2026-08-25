import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Sidebar } from "../Sidebar";

describe("Sidebar", () => {
  it("renders sections and toggles collapsed state", async () => {
    const user = userEvent.setup();
    render(
      <Sidebar
        header={<span>POS</span>}
        sections={[
          {
            title: "Main",
            items: [{ label: "Orders", href: "/orders", active: true }],
          },
        ]}
      />,
    );
    expect(screen.getByRole("navigation", { name: "Main" })).toBeVisible();
    expect(screen.getByText("Orders")).toBeVisible();
    const toggle = screen.getByRole("button", { name: /collapse sidebar/i });
    await user.click(toggle);
    expect(screen.queryByText("Main")).not.toBeInTheDocument();
  });
});
