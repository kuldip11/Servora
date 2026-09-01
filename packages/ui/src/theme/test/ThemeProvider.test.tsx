import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ThemeProvider, useTheme } from "../ThemeProvider";

const Consumer = () => {
  const { theme, setTheme } = useTheme();
  return <button onClick={() => setTheme("dark")}>{theme}</button>;
};

describe("ThemeProvider", () => {
  it("provides the default theme and persists changes", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider defaultTheme="light">
        <Consumer />
      </ThemeProvider>,
    );
    expect(screen.getByRole("button")).toHaveTextContent("light");
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem("pos-theme")).toBe("dark");
  });
  it("throws when useTheme is used outside the provider", () => {
    expect(() => render(<Consumer />)).toThrow(
      "useTheme must be used within a <ThemeProvider>",
    );
  });
});
