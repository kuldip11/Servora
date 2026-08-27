import { Elysia } from "elysia";
import { customerController } from "./customer.controller";
import { customerClientIp, enforceCustomerRateLimit } from "./customer-rate-limit";
import { createCustomerOrderBody, createSessionBody, customerCheckoutBody, customerOrderIdParams } from "./customer.validator";

const sessionToken = (headers: Record<string, string | undefined>) => headers["x-customer-session"];

export const customerRouter = new Elysia({ prefix: "/api/customer" })
  .post(
    "/sessions",
    async ({ body, set, request }) => {
      const rate = await enforceCustomerRateLimit(request, "ip", customerClientIp(request));
      if (!rate.allowed) {
        set.status = 429;
        return { success: false, code: "RATE_LIMITED", message: "Too many session requests. Please try again shortly.", retryAfter: rate.retryAfter };
      }
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
    async ({ headers, body, set, request }) => {
      const token = sessionToken(headers);
      if (!token) {
        set.status = 401;
        return { success: false, code: "CUSTOMER_SESSION_REQUIRED", message: "Customer session is required" };
      }
      const rate = await enforceCustomerRateLimit(request, "session", token);
      if (!rate.allowed) {
        set.status = 429;
        return { success: false, code: "RATE_LIMITED", message: "Too many orders. Please wait a moment before trying again.", retryAfter: rate.retryAfter };
      }
      set.status = 201;
      return customerController.createOrder(token, body);
    },
    { body: createCustomerOrderBody },
  )
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
