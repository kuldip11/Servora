import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NavLink, navItemClasses } from "../shared";

describe("navigation shared", () => {
  it("renders links, buttons and active state", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <NavLink item={{ label: "Orders", onClick, active: true }}>
        Orders
      </NavLink>,
    );
    const button = screen.getByRole("button", { name: "Orders" });
    expect(button).toHaveAttribute("aria-current", "page");
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(navItemClasses(true)).toContain("bg-primary-surface");
  });
  it("renders disabled hrefs without an href", () => {
    render(
      <NavLink item={{ label: "Disabled", href: "/disabled", disabled: true }}>
        Disabled
      </NavLink>,
    );
    expect(screen.getByText("Disabled").closest("a")).not.toHaveAttribute(
      "href",
    );
  });
});
