import { Elysia, t } from "elysia";
import { requireAuthPlugin, requirePermission } from "@/core/auth";
import { successResponse } from "@/core/response";
import {
  menuChangeLog,
  type MenuChangeEntityType,
  type MenuChangeType,
} from "./menu-change-log";
import { compact } from "@/lib/object-utils";

export const menuChangeLogRouter = new Elysia({ prefix: "/api/menu/history" })
  .use(requireAuthPlugin())
  .get(
    "/",
    async ({ auth, query }) => {
      requirePermission(auth, "audit:read");
      const before = query.before ? new Date(query.before) : undefined;
      return successResponse(
        await menuChangeLog.list(
          auth.tenantId,
          compact({
            entityType: query.entityType as MenuChangeEntityType | undefined,
            entityId: query.entityId,
            changeType: query.changeType as MenuChangeType | undefined,
            before:
              before && !Number.isNaN(before.getTime()) ? before : undefined,
            limit: query.limit,
          }),
        ),
      );
    },
    {
      query: t.Object({
        entityType: t.Optional(
          t.Union([
            t.Literal("MENU_ITEM"),
            t.Literal("VARIANT"),
            t.Literal("MODIFIER_GROUP"),
            t.Literal("MODIFIER_OPTION"),
            t.Literal("CATEGORY"),
            t.Literal("MENU"),
            t.Literal("MENU_MEMBERSHIP"),
            t.Literal("PRICE_RULE"),
            t.Literal("PROMOTION"),
            t.Literal("RECIPE"),
            t.Literal("TEMPLATE"),
            t.Literal("AVAILABILITY"),
            t.Literal("TAG"),
          ]),
        ),
        entityId: t.Optional(t.String({ format: "uuid" })),
        changeType: t.Optional(
          t.Union([
            t.Literal("CREATED"),
            t.Literal("UPDATED"),
            t.Literal("PUBLISHED"),
            t.Literal("ARCHIVED"),
            t.Literal("DELETED"),
          ]),
        ),
        before: t.Optional(t.String({ format: "date-time" })),
        limit: t.Optional(t.Integer({ minimum: 1, maximum: 100 })),
      }),
    },
  );
