import { createRoot } from "react-dom/client";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { useLocalStorage } from "../../shared/hooks/useLocalStorage";
import { useMediaQuery } from "../../shared/hooks/useMediaQuery";
import { useExportMenu } from "../../features/menu/hooks/useExportMenu";
import { menuExportService } from "../../features/menu/services/menu-export.service";
import { notifyError } from "../../shared/lib/notify";

vi.mock("../../shared/lib/notify", () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));
vi.mock("../../features/menu/services/menu-export.service", () => ({
  menuExportService: { download: vi.fn() },
}));

function renderHook<T>(hook: () => T) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  let value!: T;
  function Probe() {
    value = hook();
    return null;
  }
  const root = createRoot(container);
  act(() => root.render(<Probe />));
  return {
    get result() {
      return value;
    },
    rerender: () => act(() => root.render(<Probe />)),
    unmount: () => act(() => root.unmount()),
  };
}

describe("browser utility hooks", () => {
  it("persists local storage values and falls back on malformed JSON", () => {
    localStorage.clear();
    let hook = renderHook(() => useLocalStorage("coverage-key", { count: 1 }));
    expect(hook.result[0]).toEqual({ count: 1 });
    act(() => hook.result[1]({ count: 2 }));
    hook.rerender();
    expect(JSON.parse(localStorage.getItem("coverage-key")!)).toEqual({
      count: 2,
    });
    hook.unmount();

    localStorage.setItem("broken", "{not-json");
    const brokenHook = renderHook(() => useLocalStorage("broken", "fallback"));
    expect(brokenHook.result[0]).toBe("fallback");
    brokenHook.unmount();
  });

  it("tracks media query changes and cleans up listeners", () => {
    let listener: ((event: MediaQueryListEvent) => void) | undefined;
    const add = vi.fn((_: string, cb: (event: MediaQueryListEvent) => void) => {
      listener = cb;
    });
    const remove = vi.fn();
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: add,
        removeEventListener: remove,
      })),
    );
    const hook = renderHook(() => useMediaQuery("(min-width: 800px)"));
    expect(hook.result).toBe(false);
    act(() => listener?.({ matches: true } as MediaQueryListEvent));
    expect(hook.result).toBe(true);
    hook.unmount();
    expect(add).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("handles export success and failure states", async () => {
    const download = vi.mocked(menuExportService.download);
    let resolveDownload!: () => void;
    download.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveDownload = resolve;
        }),
    );
    const hook = renderHook(() => useExportMenu());
    let promise: Promise<void>;
    act(() => {
      promise = hook.result.download("items", "csv");
    });
    hook.rerender();
    expect(hook.result.downloadingKey).toBe("items-csv");
    await act(async () => {
      resolveDownload();
      await promise;
    });
    expect(hook.result.downloadingKey).toBeNull();
    expect(download).toHaveBeenCalledWith("items", "csv");

    download.mockRejectedValueOnce(new Error("download failed"));
    await act(async () => {
      await hook.result.download("categories", "xlsx");
    });
    expect(vi.mocked(notifyError)).toHaveBeenCalledWith(
      undefined,
      "Failed to export categories",
    );
    expect(hook.result.downloadingKey).toBeNull();
    hook.unmount();
  });
});
