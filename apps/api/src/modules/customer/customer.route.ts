import { Elysia } from "elysia";
import { customerController } from "./customer.controller";
import { createCustomerOrderBody, createSessionBody, customerCheckoutBody, customerOrderIdParams, takeawayPaymentVerificationBody } from "./customer.validator";
import { CustomerSessionRequiredError } from "../../core/errors";

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
      throw new CustomerSessionRequiredError();
    }
    return customerController.getMenu(token);
  })
  .post(
    "/orders",
    ({ headers, body, set }) => {
      const token = sessionToken(headers);
      if (!token) throw new CustomerSessionRequiredError();
      set.status = 201;
      return customerController.createOrder(token, body, headers["x-customer-request-id"]);
    },
    { body: createCustomerOrderBody },
  )
  .post("/orders/:id/payment/initiate", ({ headers, params, set }) => {
    const token = sessionToken(headers);
    if (!token) throw new CustomerSessionRequiredError();
    set.status = 201;
    return customerController.initiateTakeawayPayment(token, params.id);
  }, { params: customerOrderIdParams })
  .post("/orders/:id/payment/verify", ({ headers, params, body, set }) => {
    const token = sessionToken(headers);
    if (!token) throw new CustomerSessionRequiredError();
    set.status = 201;
    return customerController.verifyTakeawayPayment(token, params.id, body);
  }, { params: customerOrderIdParams, body: takeawayPaymentVerificationBody })
  .post("/orders/:id/checkout", ({ headers, params, body, set }) => {
    const token = sessionToken(headers);
    if (!token) {
      throw new CustomerSessionRequiredError();
    }
    set.status = 201;
    return customerController.checkout(token, { orderId: params.id, ...body });
  }, { params: customerOrderIdParams, body: customerCheckoutBody })
  .get("/orders/:id", ({ headers, params, set }) => {
    const token = sessionToken(headers);
    if (!token) {
      throw new CustomerSessionRequiredError();
    }
    return customerController.getOrder(token, params.id);
  }, { params: customerOrderIdParams });
