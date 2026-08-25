import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "../../../theme/ThemeProvider";
import { ThemeSwitcher } from "../ThemeSwitcher";

describe("ThemeSwitcher", () => {
  it("opens the theme options and changes the selected theme", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeSwitcher label="Theme" />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole("combobox", { name: "Theme" }));
    expect(screen.getByRole("option", { name: "Dark" })).toBeVisible();
    await user.click(screen.getByRole("option", { name: "Dark" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });
});
