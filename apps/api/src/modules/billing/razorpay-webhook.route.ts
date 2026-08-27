import { Elysia } from "elysia";
import { razorpayWebhookService } from "./razorpay-webhook.service";
import { AppError, ErrorCode } from "../../core/errors";
import { successResponse } from "../../core/response";

export const razorpayWebhookRouter = new Elysia({ prefix: "/api/webhooks" }).post("/razorpay", async ({ request, set }) => {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? undefined;
  const eventId = request.headers.get("x-razorpay-event-id") ?? undefined;
  try {
    const result = await razorpayWebhookService.handle(rawBody, signature, eventId);
    set.status = 200;
    return successResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook";
    const statusCode = message.includes("required") || message.includes("Invalid Razorpay webhook") ? 400 : 503;
    throw new AppError({ code: statusCode === 400 ? ErrorCode.VALIDATION_FAILED : ErrorCode.SERVICE_UNAVAILABLE, message }, statusCode);
  }
});
