import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TicketItems } from "@/features/kitchen/components/TicketItems";
import { TicketFooter } from "@/features/kitchen/components/TicketFooter";
import { TicketHeader } from "@/features/kitchen/components/TicketHeader";
import { TicketCard } from "@/features/kitchen/components/TicketCard";
import { ticket } from "@/features/kitchen/test/fixtures";
import { filterTicketForStation } from "@/features/kitchen/utils/ticket";
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
  it("does not render non-preparable combo parent rows", () => {
    const parent = {
      ...ticket.items[0]!,
      id: "combo-parent",
      menuItemId: null,
      menuItemName: "Lunch Combo",
      comboId: "combo-1",
      comboGroupId: "group-1",
    };
    const child = {
      ...ticket.items[0]!,
      id: "combo-child",
      comboId: "combo-1",
      comboGroupId: "group-1",
    };
    const h = renderToStaticMarkup(
      <TicketItems notes={null} items={[parent, child]} />,
    );
    expect(h).not.toContain("Lunch Combo");
    expect(h).toContain("Burger");
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
  it("splits combo components by station while preserving the shared combo marker", () => {
    const grillChild = {
      ...ticket.items[0]!,
      id: "combo-grill",
      menuItemName: "Grilled Steak",
      stationId: "grill",
      comboId: "combo-1",
      comboGroupId: "shared-group",
    };
    const coldChild = {
      ...ticket.items[0]!,
      id: "combo-cold",
      menuItemName: "Garden Salad",
      stationId: "cold",
      comboId: "combo-1",
      comboGroupId: "shared-group",
    };
    const comboTicket = { ...ticket, items: [grillChild, coldChild] };
    const grill = filterTicketForStation(comboTicket, "grill");
    const cold = filterTicketForStation(comboTicket, "cold");
    expect(grill?.items.map((item) => item.id)).toEqual(["combo-grill"]);
    expect(cold?.items.map((item) => item.id)).toEqual(["combo-cold"]);
    const grillHtml = renderToStaticMarkup(
      <TicketItems notes={null} items={grill!.items} />,
    );
    const coldHtml = renderToStaticMarkup(
      <TicketItems notes={null} items={cold!.items} />,
    );
    expect(grillHtml).toContain("Grilled Steak");
    expect(grillHtml).not.toContain("Garden Salad");
    expect(coldHtml).toContain("Garden Salad");
    expect(coldHtml).not.toContain("Grilled Steak");
    expect(grillHtml).toContain("Combo · shared");
    expect(coldHtml).toContain("Combo · shared");
  });

  it("G2/G3/G6 renders zones, captured weight, and distinguishes REFILL from REFIRE", () => {
    const base = ticket.items[0]!;
    const zoned = {
      ...base,
      id: "zone-line",
      weightQuantity: 450,
      weightUnit: "G" as const,
      modifiers: [
        { ...base.modifiers[0]!, name: "Pepperoni", zoneLabel: "LEFT" },
        {
          ...base.modifiers[0]!,
          modifierId: "mod2",
          name: "Mushroom",
          zoneLabel: "RIGHT",
        },
      ],
    };
    const refill = {
      ...base,
      id: "refill-line",
      menuItemName: "Rice",
      refiresOrderItemId: "rice-original",
      refireType: "REFILL" as const,
    };
    const refire = {
      ...base,
      id: "refire-line",
      menuItemName: "Steak",
      refiresOrderItemId: "steak-original",
      refireType: "REFIRE" as const,
    };
    const h = renderToStaticMarkup(
      <TicketItems notes={null} items={[zoned, refill, refire]} />,
    );
    expect(h).toContain("LEFT: Pepperoni");
    expect(h).toContain("RIGHT: Mushroom");
    expect(h).toContain("450 G");
    expect(h).toContain("REFILL · INCLUDED");
    expect(h).toContain("REFIRE");
  });
});
