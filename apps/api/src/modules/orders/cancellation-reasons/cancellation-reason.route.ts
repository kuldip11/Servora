import { Elysia, t } from "elysia";
import { requireAuthPlugin } from "../../../core/auth";
import { createdResponse, successResponse } from "../../../core/response";
import { cancellationReasonService } from "./cancellation-reason.service";

const idParams = t.Object({ id: t.String({ format: "uuid" }) });
const reasonBody = t.Object({ label: t.String({ minLength: 1, maxLength: 120 }) });

export const cancellationReasonsRouter = new Elysia({ prefix: "/api/orders/cancellation-reasons" })
  .use(requireAuthPlugin())
  .get("/", async ({ auth, query }) => successResponse(
    await cancellationReasonService.list(auth, query.activeOnly === "true"),
  ), { query: t.Object({ activeOnly: t.Optional(t.String()) }) })
  .post("/", async ({ auth, body }) => createdResponse(
    await cancellationReasonService.create(auth, body.label),
  ), { body: reasonBody })
  .patch("/:id", async ({ auth, params, body }) => successResponse(
    await cancellationReasonService.update(auth, params.id, body),
  ), {
    params: idParams,
    body: t.Partial(t.Object({ label: t.String({ minLength: 1, maxLength: 120 }), isActive: t.Boolean() })),
  });
