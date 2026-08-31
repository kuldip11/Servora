import { customerRepository } from "./customer.repository";
import {
  customerBranchUnavailable,
  customerTableNotFound,
  invalidCustomerSession,
} from "./customer.errors";

const SESSION_TTL_MINUTES = 12 * 60;

export type CustomerSessionMode = "DINE_IN" | "TAKEAWAY";

export const customerSessionService = {
  async createSession(qrToken: string) {
    const table = await customerRepository.findTableByQrToken(qrToken);
    if (table) {
      if (
        !table.branch.isActive ||
        !table.branch.dineInEnabled ||
        !table.branch.tablesEnabled
      ) {
        throw customerBranchUnavailable();
      }
      const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60_000);
      const session = await customerRepository.createSession({
        tenantId: table.tenantId,
        branchId: table.branchId,
        tableId: table.id,
        mode: "DINE_IN",
        expiresAt,
      });
      return {
        sessionToken: session.token,
        expiresAt: session.expiresAt,
        mode: "DINE_IN" as const,
        restaurant: { id: table.branch.id, name: table.branch.name },
        table: { id: table.id, name: table.name, section: table.section },
      };
    }

    const branch = await customerRepository.findBranchByTakeawayQrToken(qrToken);
    if (!branch || !branch.takeawayEnabled) throw customerTableNotFound();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60_000);
    const session = await customerRepository.createSession({
      tenantId: branch.tenantId,
      branchId: branch.id,
      tableId: null,
      mode: "TAKEAWAY",
      expiresAt,
    });
    return {
      sessionToken: session.token,
      expiresAt: session.expiresAt,
      mode: "TAKEAWAY" as const,
      restaurant: { id: branch.id, name: branch.name },
      table: null,
    };
  },

  async getSession(token: string) {
    const session = await customerRepository.findSession(token);
    if (!session || session.expiresAt.getTime() <= Date.now()) {
      throw invalidCustomerSession();
    }
    if (
      !session.branch.isActive ||
      (session.mode === "DINE_IN" &&
        (!session.branch.dineInEnabled || !session.branch.tablesEnabled)) ||
      (session.mode === "TAKEAWAY" && !session.branch.takeawayEnabled)
    ) {
      throw customerBranchUnavailable();
    }
    return session;
  },
};
