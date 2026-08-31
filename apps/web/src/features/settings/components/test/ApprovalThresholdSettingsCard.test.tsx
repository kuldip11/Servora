import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApprovalThresholdSettingsCard } from "../ApprovalThresholdSettingsCard";

const api = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }));
vi.mock("../../../../shared/lib/api-client", () => ({ apiClient: { get: api.get, put: api.put } }));
vi.mock("../../../../shared/lib/notify", () => ({ notifySuccess: vi.fn(), notifyError: vi.fn() }));

function renderCard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><ApprovalThresholdSettingsCard /></QueryClientProvider>);
}

describe("ApprovalThresholdSettingsCard", () => {
  it("renders defaults while the thresholds query is still loading", () => {
    api.get.mockReturnValueOnce(new Promise(() => {}));
    renderCard();

    const thresholds = screen.getAllByLabelText("Approval threshold");
    const roles = screen.getAllByLabelText("Required role");
    expect((thresholds[0] as HTMLInputElement | undefined)?.value).toBe("500");
    expect((thresholds[1] as HTMLInputElement | undefined)?.value).toBe("500");
    expect((roles[0] as HTMLInputElement | undefined)?.value).toBe("Manager");
    expect((roles[1] as HTMLInputElement | undefined)?.value).toBe("Manager");
  });

  it("loads and saves the configured threshold and required role", async () => {
    api.get.mockResolvedValueOnce({ data: { data: [
      { id: "v", actionType: "VOID", thresholdAmount: "500.00", requiresRole: "Manager" },
      { id: "c", actionType: "COMP", thresholdAmount: "750.00", requiresRole: "Owner" },
    ] } });
    api.put.mockResolvedValue({ data: { data: {} } });
    renderCard();

    const thresholds = await screen.findAllByLabelText("Approval threshold");
    const roles = screen.getAllByLabelText("Required role");
    expect((thresholds[0] as HTMLInputElement | undefined)?.value).toBe("500");
    expect((roles[0] as HTMLInputElement | undefined)?.value).toBe("Manager");

    fireEvent.change(thresholds[0]!, { target: { value: "600" } });
    fireEvent.change(roles[0]!, { target: { value: "Supervisor" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Save" })[0]!);

    await waitFor(() => expect(api.put).toHaveBeenCalledWith("/approvals/thresholds/VOID", { thresholdAmount: 600, requiresRole: "Supervisor" }));
  });
});
