import { Elysia, t } from "elysia";
import { requireAuthPlugin } from "../../core/auth";
import { customerRequestService } from "./customer-requests";
import { CustomerSessionRequiredError } from "../../core/errors";
import { createdResponse, successResponse } from "../../core/response";

const customerRequestType = t.Union([t.Literal("CALL_WAITER"), t.Literal("WATER"), t.Literal("CUTLERY"), t.Literal("BILL"), t.Literal("ASSISTANCE")]);
const customerRequestStatus = t.Union([t.Literal("ACKNOWLEDGED"), t.Literal("RESOLVED"), t.Literal("CANCELLED")]);

export const customerRequestRouter = new Elysia()
  .post("/api/customer/requests", async ({ headers, body }) => {
    const token = headers["x-customer-session"];
    if (!token) throw new CustomerSessionRequiredError();
    return createdResponse(await customerRequestService.create(token, body));
  }, { body: t.Object({ type: customerRequestType, note: t.Optional(t.String({ maxLength: 500 })), orderId: t.Optional(t.String({ format: "uuid" })) }) })
  .use(requireAuthPlugin())
  .get("/api/customer/requests", async ({ auth }) => successResponse(await customerRequestService.listForStaff(auth)))
  .patch("/api/customer/requests/:id", async ({ auth, params, body }) => successResponse(await customerRequestService.updateForStaff(auth, params.id, body.status)), { params: t.Object({ id: t.String({ format: "uuid" }) }), body: t.Object({ status: customerRequestStatus }) });
