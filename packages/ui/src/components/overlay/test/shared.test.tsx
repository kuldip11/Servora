import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  MenuItemContent,
  menuItemClasses,
  OverlayHeader,
  overlayPanelClasses,
} from "../shared";

describe("overlay shared", () => {
  it("renders common menu and header primitives", () => {
    render(
      <>
        <OverlayHeader title="Dialog" onClose={() => {}} />
        <MenuItemContent label="Save" shortcut="⌘S" onSelect={() => {}} />
      </>,
    );
    expect(screen.getByText("Dialog")).toBeVisible();
    expect(screen.getByText("Save")).toBeVisible();
    expect(screen.getByText("⌘S")).toBeVisible();
    expect(menuItemClasses(true)).toContain("text-danger");
    expect(overlayPanelClasses).toContain("bg-surface");
  });
});
