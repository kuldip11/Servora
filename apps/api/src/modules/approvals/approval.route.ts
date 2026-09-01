import { Elysia, t } from "elysia";
import { requireAuthPlugin } from "@/core/auth";
import { createdResponse, successResponse } from "@/core/response";
import { approvalService } from "./approval.service";

const action = t.Union([t.Literal("VOID"), t.Literal("COMP")]);
export const approvalsRouter = new Elysia({ prefix: "/api/approvals" })
  .use(requireAuthPlugin())
  .get("/thresholds", ({ auth }) => successResponse(approvalService.list(auth)))
  .put(
    "/thresholds/:actionType",
    ({ auth, params, body }) =>
      successResponse(
        approvalService.upsert(
          auth,
          params.actionType,
          body.thresholdAmount,
          body.requiresRole,
        ),
      ),
    {
      params: t.Object({ actionType: action }),
      body: t.Object({
        thresholdAmount: t.Number({ minimum: 0 }),
        requiresRole: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
      }),
    },
  )
  .post(
    "/manager",
    ({ auth, body }) => createdResponse(approvalService.issue(auth, body)),
    {
      body: t.Object({
        actionType: action,
        orderId: t.String({ format: "uuid" }),
        orderItemId: t.String({ format: "uuid" }),
        managerEmail: t.String({ format: "email" }),
        password: t.String({ minLength: 1 }),
      }),
    },
  );
