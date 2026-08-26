import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CommandPalette } from "../CommandPalette";

describe("CommandPalette", () => {
  it("filters commands and commits the selected command", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <CommandPalette
        open
        onOpenChange={onOpenChange}
        items={[
          { id: "orders", label: "Orders", group: "Navigation", onSelect },
          { id: "billing", label: "Billing", onSelect: vi.fn() },
        ]}
      />,
    );
    const input = screen.getByRole("combobox");
    await user.type(input, "order");
    expect(screen.getByRole("option", { name: /Orders/ })).toBeVisible();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
  it("announces an empty search result", async () => {
    const user = userEvent.setup();
    render(
      <CommandPalette
        open
        onOpenChange={() => {}}
        emptyMessage="Nothing found"
        items={[{ id: "orders", label: "Orders", onSelect: () => {} }]}
      />,
    );
    await user.type(screen.getByRole("combobox"), "xyz");
    expect(screen.getByRole("listbox")).toHaveTextContent("Nothing found");
  });
});
