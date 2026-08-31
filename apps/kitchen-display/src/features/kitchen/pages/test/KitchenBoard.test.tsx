import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("@pos/ui", () => ({
  Grid: ({ children }: any) => <div>{children}</div>,
  IconButton: () => <button>icon</button>,
  Spinner: () => <span>loading</span>,
  EmptyState: () => <span>empty</span>,
  Popover: ({ children }: any) => <div>{children}</div>,
  ThemeSwitcher: () => <span>theme</span>,
}));
vi.mock("../../hooks/useKitchenTickets", () => ({
  useKitchenStations: () => ({ data: [] }),
  useKitchenTickets: () => ({
    data: [],
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
}));
vi.mock("../../hooks/useUpdateTicketStatus", () => ({
  useUpdateTicketStatus: () => ({
    isPending: false,
    variables: null,
    mutate: vi.fn(),
  }),
}));
vi.mock("../../hooks/useKitchenRealtime", () => ({
  useKitchenRealtime: () => ({ connected: true }),
}));
import { KitchenBoard } from "@/features/kitchen/pages/KitchenBoard";
describe("KitchenBoard", () =>
  it("renders board shell", () => {
    const h = renderToStaticMarkup(<KitchenBoard onLogout={() => {}} />);
    expect(h).toContain("Kitchen Display");
    expect(h).toContain("Held");
    expect(h).toContain("New");
    expect(h).toContain("In Prep");
    expect(h).toContain("Ready");
  }));
