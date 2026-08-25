/**
 * Typed authentication + authorization context.
 *
 * The access token authenticates the user only. Active franchise/branch are
 * request-scoped selectors (`X-Tenant-ID` / `X-Branch-ID`) and are always
 * re-authorized against the database. This keeps authentication independent
 * from UI context switching and avoids rotating tokens when the user changes
 * franchise or branch.
 */
import { Elysia } from "elysia";
import type { RoleName } from "@pos/types";
import { verifyAccessToken, type JwtPayload } from "../../lib/jwt";
import { db } from "../../db";
import {
  resolveAuthorization,
  resolveMembership,
} from "../../lib/authorization/authorization";
import { globalUserRoles } from "../../db/schema";
import { eq } from "drizzle-orm";
import { resolveActiveBranch } from "../../lib/authorization/membership-context";
import {
  UnauthorizedError,
  ForbiddenError,
  MissingBranchError,
} from "../errors";
import { createLogger, type Logger } from "../logger";
import { requestContextPlugin } from "../context";

export interface AuthContext {
  userId: string;
  tenantId: string;
  /** Internal database access-record ID for the active franchise. */
  membershipId?: string;
  /** `null` means no branch filter (tenant-wide aggregate view). */
  branchId: string | null;
  email: string;
  roles: RoleName[];
  permissions: string[];
  tenantWide?: boolean;
  authorizedBranchIds?: string[];
}

function parseBearerToken(authHeader: string | undefined): string {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Authorization header missing or invalid");
  }
  return authHeader.slice(7);
}

export const requireAuthPlugin = () =>
  new Elysia({ name: "require-auth" })
    .use(requestContextPlugin())
    .derive(
      { as: "global" },
      async ({
        headers,
        requestContext,
      }): Promise<{ auth: AuthContext; logger: Logger }> => {
        const token = parseBearerToken(headers["authorization"]);

        let payload: JwtPayload;
        try {
          payload = verifyAccessToken(token);
        } catch {
          throw new UnauthorizedError("Invalid or expired token");
        }

        // Access tokens issued before this architecture change contained active
        // tenant/branch context. Force one refresh so those tokens cannot carry
        // stale context or tenant-scoped permissions into the new model.
        const legacyPayload = payload as JwtPayload & {
          tenantId?: string;
          membershipId?: string;
          branchId?: string | null;
        };
        if (
          legacyPayload.tenantId ||
          legacyPayload.membershipId ||
          legacyPayload.branchId
        ) {
          throw new UnauthorizedError(
            "Session format changed; refresh required",
          );
        }

        const requestedTenant = headers["x-tenant-id"]?.trim() ?? "";
        const requestedBranch = headers["x-branch-id"]?.trim() ?? "";

        if (!requestedTenant) {
          if (requestedBranch && requestedBranch !== "all") {
            throw new ForbiddenError("Active franchise is required");
          }

          const auth: AuthContext = {
            userId: payload.sub,
            tenantId: "",
            branchId: null,
            email: payload.email,
            roles: payload.roles as RoleName[],
            permissions: payload.permissions ?? [],
            tenantWide: true,
            authorizedBranchIds: [],
          };

          const logger = createLogger(
            { requestId: requestContext.requestId, userId: auth.userId },
            "app",
          );
          return { auth, logger };
        }

        const membership = await resolveMembership(
          db,
          payload.sub,
          requestedTenant,
        );
        if (!membership) {
          throw new ForbiddenError("Franchise access denied");
        }

        const baseContext = {
          userId: payload.sub,
          membershipId: membership.id,
          tenantId: membership.tenantId,
        };

        let branchId: string | null = null;
        if (requestedBranch && requestedBranch !== "all") {
          const active = await resolveActiveBranch(
            db,
            baseContext,
            requestedBranch,
          );
          branchId = active.branchId ?? null;
        } else if (requestedBranch === "all") {
          const decision = await resolveAuthorization(db, baseContext);
          if (!decision.allowed || !decision.tenantWide) {
            throw new ForbiddenError("Branch access denied");
          }
        }

        const decision = await resolveAuthorization(db, {
          ...baseContext,
          branchId,
        });
        if (!decision.allowed) {
          throw new ForbiddenError("Franchise access denied");
        }

        const globalRoles = await db.query.globalUserRoles.findMany({
          where: eq(globalUserRoles.userId, payload.sub),
          with: { role: true },
        });
        const roles = [
          ...new Set([
            ...globalRoles.map((item: any) => item.role?.name ?? item.roleId),
            ...membership.roles.map(
              (item: any) => item.role?.name ?? item.roleId,
            ),
          ]),
        ] as RoleName[];

        const auth: AuthContext = {
          userId: payload.sub,
          tenantId: membership.tenantId,
          membershipId: membership.id,
          branchId,
          email: payload.email,
          roles,
          permissions: decision.permissionKeys,
          tenantWide: decision.tenantWide,
          authorizedBranchIds: decision.branchIds,
        };

        const logger = createLogger(
          {
            requestId: requestContext.requestId,
            tenantId: auth.tenantId,
            ...(auth.branchId ? { branchId: auth.branchId } : {}),
            userId: auth.userId,
          },
          "app",
        );

        return { auth, logger };
      },
    );

export function requireRoles(auth: AuthContext, allowed: RoleName[]): void {
  const hasRole = allowed.some((role) => auth.roles.includes(role));
  if (!hasRole)
    throw new ForbiddenError("Insufficient permissions", {
      required: allowed,
      actual: auth.roles,
    });
}

export function requirePermission(auth: AuthContext, permission: string): void {
  // A context is still required for tenant/branch data operations. This is
  // separate from permission checking: selecting a franchise/branch never
  // requires a permission of its own.
  if (!auth.tenantId) {
    // Tenant selection/creation is intentionally usable before an active
    // tenant context exists. All other permissions require a selected tenant.
    if (permission === "tenant:read" || permission === "tenant:create") return;
    throw new ForbiddenError("Tenant context required");
  }

  // OWNER is the global superuser role. Business permissions are therefore
  // derived from the role and never used to decide whether the owner may act.
  if (auth.roles.includes("OWNER")) return;

  if (!auth.permissions.includes(permission)) {
    throw new ForbiddenError("Insufficient permissions", {
      required: permission,
    });
  }
}

export function requireBranch(
  auth: AuthContext,
  message = "Please select a specific branch.",
): string {
  if (!auth.branchId) throw new MissingBranchError(message);
  return auth.branchId;
}
