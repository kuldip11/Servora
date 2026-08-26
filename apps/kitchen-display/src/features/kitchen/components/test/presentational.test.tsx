import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TicketItems } from "../TicketItems";
import { TicketFooter } from "../TicketFooter";
import { TicketHeader } from "../TicketHeader";
import { TicketCard } from "../TicketCard";
import { ticket } from "../../test/fixtures";
vi.mock("@pos/ui", () => ({
  Card: ({ children, ...p }: any) => <div {...p}>{children}</div>,
  StatusBadge: ({ label }: any) => <span>{label}</span>,
}));
describe("ticket components", () => {
  it("renders items and notes", () => {
    const h = renderToStaticMarkup(
      <TicketItems notes={ticket.notes} items={ticket.items} />,
    );
    expect(h).toContain("Burger");
    expect(h).toContain("Large");
    expect(h).toContain("Cheese");
    expect(h).toContain("No onion");
  });
  it("renders footer workflow", () => {
    expect(
      renderToStaticMarkup(
        <TicketFooter
          next="PREPARING"
          nextLabel="Start Cooking"
          btnClass=""
          isUpdating={false}
          onAdvance={() => {}}
        />,
      ),
    ).toContain("Start Cooking");
    expect(
      renderToStaticMarkup(
        <TicketFooter
          next={null}
          nextLabel={null}
          btnClass=""
          isUpdating={false}
          onAdvance={() => {}}
        />,
      ),
    ).toContain("Waiting for waiter");
  });
  it("renders header and card", () => {
    const h = renderToStaticMarkup(
      <>
        <TicketHeader
          ticket={ticket}
          statusLabel="Waiting"
          statusTone="info"
          statusTextClass=""
        />
        <TicketCard
          ticket={ticket}
          isUpdating={false}
          onUpdateStatus={() => {}}
        />
      </>,
    );
    expect(h).toContain("Table 12");
    expect(h).toContain("Waiting");
    expect(h).toContain("Start Cooking");
  });
});
