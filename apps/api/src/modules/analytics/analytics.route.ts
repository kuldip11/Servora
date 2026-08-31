import { Elysia } from "elysia";
import { requireAuthPlugin } from "../../core/auth";
import { analyticsController } from "./analytics.controller";

export const analyticsRouter = new Elysia()

  .use(requireAuthPlugin())
  .get("/api/analytics/dashboard", ({ auth }) =>
    analyticsController.getDashboard(auth),
  )
  .get("/api/analytics/cost-margin", ({ auth, query }) =>
    analyticsController.getCostMarginReport(auth, query.categoryId),
  )
  .get("/api/analytics/menu-engineering", ({ auth, query }) =>
    analyticsController.getMenuEngineeringReport(auth, query.windowDays),
  );
