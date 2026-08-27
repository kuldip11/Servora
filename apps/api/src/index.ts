import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";

import { requestContextPlugin } from "./core/context";
import { AppError } from "./core/errors";
import { rootLogger } from "./core/logger";

import { authRouter, authMeRouter } from "./modules/auth/auth.route";
import { branchesRouter } from "./modules/branches/branch.route";
import { tenantsRouter } from "./modules/tenants/tenant.route";
import { tablesRouter } from "./modules/tables/table.route";
import { ordersRouter } from "./modules/orders/order.route";
import { kitchenTicketsRouter } from "./modules/kitchen-tickets/ticket.route";
import { menuAuthorizationPlugin } from "./modules/menu/menu-authorization-plugin";
import { menuItemsRouter } from "./modules/menu/items/item.route";
import { menuCategoriesRouter } from "./modules/menu/categories/category.route";
import { menuAvailabilityRouter } from "./modules/menu/availability/availability.route";
import { menuModifiersRouter } from "./modules/menu/modifiers/modifier.route";
import { menuBulkOpsRouter } from "./modules/menu/bulk-ops/bulk-ops.route";
import { menuRecipesRouter } from "./modules/menu/recipes/recipes.route";
import { menuImportExportRouter } from "./modules/menu/import-export/import-export.route";
import { menuTemplatesRouter } from "./modules/menu/templates/templates.route";
import { inventoryRouter } from "./modules/inventory/inventory.route";
import { billingRouter } from "./modules/billing/billing.route";
import { staffRouter, rolesRouter } from "./modules/staff/staff.route";
import { analyticsRouter } from "./modules/analytics/analytics.route";
import { realtimeRouter, customerRealtimeRouter } from "./modules/realtime/gateway";
import { customerRouter } from "./modules/customer/customer.route";
import { customerRequestRouter } from "./modules/customer/customer-requests.route";

const corsOrigins = (
  process.env["CORS_ORIGIN"] ?? "http://localhost:5173,http://localhost:5176"
).split(",");

const app = new Elysia()
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
          version: "1.0.0",
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
  // Health check
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  }))
  // Routers
  .use(authRouter)
  .use(authMeRouter)
  .use(branchesRouter)
  .use(tenantsRouter)
  .use(tablesRouter)
  .use(ordersRouter)
  .use(kitchenTicketsRouter)
  .use(menuAuthorizationPlugin())
  .use(menuItemsRouter)
  .use(menuCategoriesRouter)
  .use(menuAvailabilityRouter)
  .use(menuModifiersRouter)
  .use(menuBulkOpsRouter)
  .use(menuRecipesRouter)
  .use(menuImportExportRouter)
  .use(menuTemplatesRouter)
  .use(inventoryRouter)
  .use(billingRouter)
  .use(staffRouter)
  .use(rolesRouter)
  .use(analyticsRouter)
  .use(customerRouter)
  .use(customerRequestRouter)
  .use(realtimeRouter)
  .use(customerRealtimeRouter)
  // Global error handler
  .onError(({ code, error, set, requestContext }) => {
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

    console.error(`[API Error] ${code}:`, error);

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

const port = parseInt(process.env["PORT"] ?? "3000");

app.listen(port, () => {
  console.log(`🚀 API running at http://localhost:${port}`);
  console.log(`📖 Swagger docs at http://localhost:${port}/swagger`);
});

export type App = typeof app;
