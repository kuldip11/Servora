import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SelectMenu } from "../SelectMenu";

describe("SelectMenu", () => {
  const options = [
    { value: "one", label: "One" },
    { value: "two", label: "Two" },
  ];
  it("opens and commits an option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SelectMenu
        label="Choice"
        options={options}
        value={undefined}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "Choice" }));
    await user.click(screen.getByRole("option", { name: "Two" }));
    expect(onChange).toHaveBeenCalledWith("two");
  });
  it("shows errors accessibly", () => {
    render(
      <SelectMenu
        label="Choice"
        options={options}
        value={undefined}
        onChange={() => {}}
        error="Required"
      />,
    );
    expect(screen.getByRole("combobox", { name: "Choice" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Required");
  });
});
