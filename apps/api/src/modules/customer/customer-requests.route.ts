import { Elysia, t } from "elysia";
import { requireAuthPlugin } from "../../core/auth";
import { customerRequestService } from "./customer-requests";

const customerRequestType = t.Union([t.Literal("CALL_WAITER"), t.Literal("WATER"), t.Literal("CUTLERY"), t.Literal("BILL"), t.Literal("ASSISTANCE")]);
const customerRequestStatus = t.Union([t.Literal("ACKNOWLEDGED"), t.Literal("RESOLVED"), t.Literal("CANCELLED")]);

export const customerRequestRouter = new Elysia()
  .post("/api/customer/requests", ({ headers, body, set }) => {
    const token = headers["x-customer-session"];
    if (!token) { set.status = 401; return { success: false, code: "CUSTOMER_SESSION_REQUIRED", message: "Customer session is required" }; }
    set.status = 201;
    return customerRequestService.create(token, body);
  }, { body: t.Object({ type: customerRequestType, note: t.Optional(t.String({ maxLength: 500 })), orderId: t.Optional(t.String({ format: "uuid" })) }) })
  .use(requireAuthPlugin())
  .get("/api/customer/requests", ({ auth }) => customerRequestService.listForStaff(auth))
  .patch("/api/customer/requests/:id", ({ auth, params, body }) => customerRequestService.updateForStaff(auth, params.id, body.status), { params: t.Object({ id: t.String({ format: "uuid" }) }), body: t.Object({ status: customerRequestStatus }) });
