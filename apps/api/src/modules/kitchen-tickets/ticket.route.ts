import { Elysia, t } from "elysia";
import { requireAuthPlugin } from "@/core/auth";
import { ticketController } from "./ticket.controller";
import { updateTicketStatusBody, ticketIdParams } from "./ticket.validator";

export const kitchenTicketsRouter = new Elysia()
  .use(requireAuthPlugin())
  .get(
    "/api/kitchen-tickets/",
    ({ auth, query }) => ticketController.getQueue(auth, query.stationId),
    {
      query: t.Object({ stationId: t.Optional(t.String({ format: "uuid" })) }),
    },
  )
  .get("/api/kitchen-tickets/stations", ({ auth }) =>
    ticketController.listStations(auth),
  )
  .patch(
    "/api/kitchen-tickets/:id/status",
    ({ params, body, auth, logger }) =>
      ticketController.updateStatus(auth, logger, params.id, body.status),
    {
      params: ticketIdParams,
      body: updateTicketStatusBody,
    },
  );
