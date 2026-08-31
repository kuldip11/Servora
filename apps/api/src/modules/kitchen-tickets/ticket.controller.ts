/**
 * Kitchen ticket controller — thin handlers only.
 *
 * Auth/branch resolution and the request-scoped logger are already on
 * context (via `requireAuthPlugin`, applied in `ticket.route.ts`), and
 * `Elysia.onError` (see `src/index.ts`) turns any thrown `AppError` into
 * the standard response envelope. So each handler here just calls the
 * service and wraps the result.
 */
import type { AuthContext } from "../../core/auth";
import type { Logger } from "../../core/logger";
import { successResponse } from "../../core/response";
import { ticketService } from "./ticket.service";
import type { KitchenTicketStatus } from "@pos/types";

export const ticketController = {
  async getQueue(auth: AuthContext, stationId?: string) {
    const queue = await ticketService.getQueueForCurrentBranch(auth, stationId);
    return successResponse(queue);
  },

  async listStations(auth: AuthContext) {
    return successResponse(await ticketService.listStationsForCurrentBranch(auth));
  },

  async updateStatus(
    auth: AuthContext,
    logger: Logger,
    ticketId: string,
    status: KitchenTicketStatus,
  ) {
    const updated = await ticketService.updateStatus(
      auth,
      logger,
      ticketId,
      status,
    );
    return successResponse(updated);
  },
};
