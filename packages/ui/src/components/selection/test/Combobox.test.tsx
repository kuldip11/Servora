import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Combobox } from "../Combobox";

describe("Combobox", () => {
  const options = [
    { value: "one", label: "One" },
    { value: "two", label: "Two" },
  ];
  it("filters by text and commits a matching option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Combobox
        label="Choice"
        options={options}
        value={undefined}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole("combobox", { name: "Choice" });
    await user.click(input);
    await user.type(input, "Tw");
    await user.click(screen.getByRole("option", { name: "Two" }));
    expect(onChange).toHaveBeenCalledWith("two");
  });
});
