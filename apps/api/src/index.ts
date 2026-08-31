import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";

import { requestContextPlugin } from "./core/context";
import { securityHeadersPlugin, rateLimitPlugin } from "./core/security";
import { requestLoggingPlugin } from "./core/observability";
import { AppError } from "./core/errors";
import { rootLogger } from "./core/logger";

import { authRouter, authMeRouter } from "./modules/auth/auth.route";
import { branchesRouter } from "./modules/branches/branch.route";
import { tenantsRouter } from "./modules/tenants/tenant.route";
import { organizationsRouter } from "./modules/organizations/organization.route";
import { tablesRouter } from "./modules/tables/table.route";
import { ordersRouter } from "./modules/orders/order.route";
import { cancellationReasonsRouter } from "./modules/orders/cancellation-reasons/cancellation-reason.route";
import { kitchenTicketsRouter } from "./modules/kitchen-tickets/ticket.route";
import { menuAuthorizationPlugin } from "./modules/menu/menu-authorization-plugin";
import { menuItemsRouter } from "./modules/menu/items/item.route";
import { menuCategoriesRouter } from "./modules/menu/categories/category.route";
import { menuAvailabilityRouter } from "./modules/menu/availability/availability.route";
import { menuModifiersRouter } from "./modules/menu/modifiers/modifier.route";
import { menuBulkOpsRouter } from "./modules/menu/bulk-ops/bulk-ops.route";
import { menuRecipesRouter } from "./modules/menu/recipes/recipes.route";
import { subRecipesRouter } from "./modules/menu/sub-recipes/sub-recipe.route";
import { menuImportExportRouter } from "./modules/menu/import-export/import-export.route";
import { menuTemplatesRouter } from "./modules/menu/templates/templates.route";
import { inventoryRouter } from "./modules/inventory/inventory.route";
import { billingRouter } from "./modules/billing/billing.route";
import { staffRouter } from "./modules/staff/staff.route";
import { rolesRouter } from "./modules/roles/role.route";
import { permissionsRouter } from "./modules/permissions/permission.route";
import { priceRulesRouter } from "./modules/menu/pricing/price-rule.route";
import { promotionsRouter } from "./modules/menu/promotions/promotion.route";
import { loyaltyRouter } from "./modules/loyalty/loyalty.route";
import { approvalsRouter } from "./modules/approvals/approval.route";
import { customerGroupsRouter } from "./modules/customer-groups/customer-group.route";
import { menusRouter } from "./modules/menu/menus/menu.route";
import { combosRouter } from "./modules/menu/combos/combo.route";
import { menuMembershipsRouter } from "./modules/menu/memberships/membership.route";
import { menuChangeLogRouter } from "./modules/menu/change-log/menu-change-log.route";
import { kitchenStationsRouter } from "./modules/kitchen-tickets/stations/station.route";
import { analyticsRouter } from "./modules/analytics/analytics.route";
import { auditRouter } from "./modules/audit/audit.route";
import {
  realtimeRouter,
  customerRealtimeRouter,
} from "./modules/realtime/gateway";
import { customerRouter } from "./modules/customer/customer.route";
import { customerRequestRouter } from "./modules/customer/customer-requests.route";
import { razorpayWebhookRouter } from "./modules/billing/razorpay-webhook.route";
import { startRazorpayWebhookWorker } from "./modules/billing/razorpay-webhook.worker";
import { db, closeDatabaseConnections } from "./db";
import { sql } from "drizzle-orm";
import { env } from "./config/env";
import { redis, closeRedisConnections } from "./lib/redis";

const corsOrigins = env.CORS_ORIGIN.split(",");

// The route-mounting chain below is long (20+ `.use()` calls across every
// module router). Elysia's context type accumulates through each `.use()`,
// and TypeScript's checker hits its recursion limit trying to compute the
// fully-merged type by the time `app.listen(...)` is evaluated (TS2589,
// "Type instantiation is excessively deep and possibly infinite"). None of
// the mounted routers depend on `app`'s own accumulated type — they're
// already fully-typed standalone Elysia instances — so it's safe to widen
// the working type to `any` at each checkpoint below purely to keep the
// compiler's bookkeeping bounded; this has no effect on runtime behavior,
// which is unchanged.
type AnyElysia = Elysia<any, any, any, any, any, any, any>;

let app = new Elysia()
  .use(
    cors({
      origin: corsOrigins,
      credentials: true,
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Tenant-ID",
        "X-Tenant-Slug",
        "X-Branch-Id",
      ],
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    }),
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: "Restaurant POS SaaS API",
          version: env.APP_VERSION,
          description: "Multi-tenant Restaurant POS Platform API",
        },
        tags: [
          { name: "auth", description: "Authentication endpoints" },
          { name: "orders", description: "Order management" },
          { name: "menu", description: "Menu management" },
          { name: "inventory", description: "Inventory management" },
          { name: "billing", description: "Billing and payments" },
          { name: "staff", description: "Staff management" },
          { name: "analytics", description: "Analytics and reports" },
        ],
      },
    }),
  )
  .use(requestContextPlugin())
  .use(securityHeadersPlugin())
  .use(rateLimitPlugin())
  .use(requestLoggingPlugin())
  // Health check
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: env.APP_VERSION,
  }))
  .get("/health/live", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  .get("/health/ready", async ({ set }) => {
    const checks = { database: false, redis: false };
    try {
      await db.execute(sql`select 1`);
      checks.database = true;
    } catch {}
    try {
      checks.redis = (await redis.ping()) === "PONG";
    } catch {}

    if (!checks.database || !checks.redis) {
      set.status = 503;
      return {
        status: "not_ready",
        checks,
        timestamp: new Date().toISOString(),
      };
    }
    return { status: "ready", checks, timestamp: new Date().toISOString() };
  }) as AnyElysia;

// Routers
app = app
  .use(authRouter)
  .use(authMeRouter)
  .use(branchesRouter)
  .use(tenantsRouter)
  .use(organizationsRouter)
  .use(tablesRouter)
  .use(ordersRouter)
  .use(cancellationReasonsRouter)
  .use(kitchenTicketsRouter)
  .use(menuAuthorizationPlugin())
  .use(menuItemsRouter)
  .use(menusRouter)
  .use(combosRouter)
  .use(menuMembershipsRouter)
  .use(menuChangeLogRouter)
  .use(kitchenStationsRouter)
  .use(menuCategoriesRouter)
  .use(menuAvailabilityRouter)
  .use(menuModifiersRouter)
  .use(menuBulkOpsRouter)
  .use(menuRecipesRouter)
  .use(subRecipesRouter)
  .use(menuImportExportRouter)
  .use(menuTemplatesRouter)
  .use(promotionsRouter)
  .use(loyaltyRouter)
  .use(approvalsRouter)
  .use(customerGroupsRouter)
  .use(priceRulesRouter)
  .use(inventoryRouter)
  .use(billingRouter)
  .use(staffRouter)
  .use(rolesRouter)
  .use(permissionsRouter)
  .use(analyticsRouter)
  .use(auditRouter)
  .use(customerRouter)
  .use(customerRequestRouter)
  .use(razorpayWebhookRouter)
  .use(realtimeRouter)
  .use(customerRealtimeRouter) as AnyElysia;

// Global error handler
app = app.onError(({ code, error, set, requestContext }) => {
  // New, typed errors (AppError and subclasses) — the pattern new modules
  // are being migrated to. Checked first; everything below is unchanged
  // legacy behavior for modules that haven't migrated yet.
  if (AppError.isAppError(error)) {
    rootLogger.warn(`API Error: ${error.code}`, {
      requestId: requestContext?.requestId,
      statusCode: error.statusCode,
      message: error.message,
      details: error.details,
    });
    set.status = error.statusCode;
    return error.toJSON();
  }

  rootLogger.error(
    `Unhandled API error: ${code}`,
    error instanceof Error ? error : undefined,
    {
      requestId: requestContext?.requestId,
    },
  );

  if (code === "VALIDATION") {
    set.status = 400;
    return {
      success: false,
      code: "VALIDATION_ERROR",
      message: "Invalid request data",
      details: error.message,
    };
  }

  if (code === "NOT_FOUND") {
    set.status = 404;
    return { success: false, code: "NOT_FOUND", message: "Route not found" };
  }

  // PostgreSQL uniqueness violations are expected domain conflicts, not
  // internal server errors. This is especially important for tenant-scoped
  // natural keys such as (tenant_id, branch_name): the database remains the
  // final authority for concurrent requests, so the API must translate a
  // 23505 into a stable 409 response.
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  ) {
    set.status = 409;
    return {
      success: false,
      code: "CONFLICT",
      message: "The requested resource conflicts with an existing record",
    };
  }

  set.status = 500;
  return {
    success: false,
    code: "INTERNAL_ERROR",
    message: "Internal server error",
  };
});

const port = env.PORT;

const stopRazorpayWebhookWorker = startRazorpayWebhookWorker();

app.listen(port, () => {
  console.log(`🚀 API running at http://localhost:${port}`);
  console.log(`📖 Swagger docs at http://localhost:${port}/swagger`);
});

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  rootLogger.info("shutdown.started", { signal });
  stopRazorpayWebhookWorker();
  try {
    await Promise.resolve(app.stop());
  } catch (error) {
    rootLogger.warn("shutdown.http_stop_failed", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
  await Promise.allSettled([
    closeRedisConnections(),
    closeDatabaseConnections(),
  ]);
  rootLogger.info("shutdown.complete", { signal });
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

export type App = typeof app;
