import { Elysia } from "elysia";
import { customerController } from "./customer.controller";
import { createCustomerOrderBody, createSessionBody, customerCheckoutBody, customerOrderIdParams, takeawayPaymentVerificationBody } from "./customer.validator";

const sessionToken = (headers: Record<string, string | undefined>) => headers["x-customer-session"];

export const customerRouter = new Elysia({ prefix: "/api/customer" })
  .post(
    "/sessions",
    ({ body, set }) => {
      set.status = 201;
      return customerController.createSession(body.qrToken);
    },
    { body: createSessionBody },
  )
  .get("/menu", ({ headers, set }) => {
    const token = sessionToken(headers);
    if (!token) {
      set.status = 401;
      return { success: false, code: "CUSTOMER_SESSION_REQUIRED", message: "Customer session is required" };
    }
    return customerController.getMenu(token);
  })
  .post(
    "/orders",
    ({ headers, body, set }) => {
      const token = sessionToken(headers);
      if (!token) {
        set.status = 401;
        return { success: false, code: "CUSTOMER_SESSION_REQUIRED", message: "Customer session is required" };
      }
      set.status = 201;
      return customerController.createOrder(token, body);
    },
    { body: createCustomerOrderBody },
  )
  .post("/orders/:id/payment/verify", ({ headers, body, set }) => {
    const token = sessionToken(headers);
    if (!token) { set.status = 401; return { success: false, code: "CUSTOMER_SESSION_REQUIRED", message: "Customer session is required" }; }
    set.status = 201;
    return customerController.verifyTakeawayPayment(token, body);
  }, { body: takeawayPaymentVerificationBody })
  .post("/orders/:id/checkout", ({ headers, params, body, set }) => {
    const token = sessionToken(headers);
    if (!token) {
      set.status = 401;
      return { success: false, code: "CUSTOMER_SESSION_REQUIRED", message: "Customer session is required" };
    }
    set.status = 201;
    return customerController.checkout(token, { orderId: params.id, ...body });
  }, { params: customerOrderIdParams, body: customerCheckoutBody })
  .get("/orders/:id", ({ headers, params, set }) => {
    const token = sessionToken(headers);
    if (!token) {
      set.status = 401;
      return { success: false, code: "CUSTOMER_SESSION_REQUIRED", message: "Customer session is required" };
    }
    return customerController.getOrder(token, params.id);
  }, { params: customerOrderIdParams });
