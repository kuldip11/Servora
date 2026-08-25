import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate, formatTime } from "../format";

describe("formatCurrency", () => {
  it("formats INR amounts using the application locale", () => {
    expect(formatCurrency(123456.78)).toBe("₹1,23,456.78");
  });

  it("supports an explicit currency", () => {
    expect(formatCurrency(1234.5, "USD")).toMatch(/\$1,234\.50/);
  });
});

describe("formatDate", () => {
  it("formats a date with the default day-month-year presentation", () => {
    expect(formatDate(new Date(2026, 7, 25, 12, 0, 0))).toBe("25 Aug 2026");
  });

  it("passes Intl date options through to the formatter", () => {
    expect(
      formatDate(new Date(2026, 7, 25, 12, 0, 0), {
        weekday: "long",
      }),
    ).toMatch(/^Tuesday, /);
  });
});

describe("formatTime", () => {
  it("formats time with a normalized uppercase meridiem marker", () => {
    expect(formatTime(new Date(2026, 7, 25, 13, 5, 0))).toMatch(/01:05 PM/i);
  });
});
