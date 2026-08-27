import { Elysia } from "elysia";
import { razorpayWebhookService } from "./razorpay-webhook.service";

export const razorpayWebhookRouter = new Elysia({ prefix: "/api/webhooks" }).post("/razorpay", async ({ request, set }) => {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? undefined;
  const eventId = request.headers.get("x-razorpay-event-id") ?? undefined;
  try {
    const result = await razorpayWebhookService.handle(rawBody, signature, eventId);
    set.status = 200;
    return { success: true, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook";
    set.status = message.includes("required") || message.includes("Invalid Razorpay webhook") ? 400 : 503;
    return { success: false, message };
  }
});
