import { act, createElement, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { useDebounce } from "../useDebounce";
describe("useDebounce", () => {
  it("debounces updates and cleans up timers", () => {
    vi.useFakeTimers();
    const values: string[] = [];
    function Probe({ value }: { value: string }) {
      const result = useDebounce(value, 100);
      useEffect(() => {
        values.push(result);
      }, [result]);
      return null;
    }
    const host = document.createElement("div");
    const root = createRoot(host);
    act(() => root.render(createElement(Probe, { value: "a" })));
    act(() => root.render(createElement(Probe, { value: "b" })));
    expect(values).toEqual(["a"]);
    act(() => vi.advanceTimersByTime(99));
    expect(values).toEqual(["a"]);
    act(() => vi.advanceTimersByTime(1));
    expect(values).toEqual(["a", "b"]);
    act(() => root.unmount());
    vi.useRealTimers();
  });
});
