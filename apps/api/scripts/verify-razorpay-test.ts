

const keyId = process.env["RAZORPAY_KEY_ID"];
const keySecret = process.env["RAZORPAY_KEY_SECRET"];
if (!keyId || !keySecret)
  throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required");
if (!keyId.startsWith("rzp_test_"))
  throw new Error(
    "Refusing to run: RAZORPAY_KEY_ID is not a Test Mode key (rzp_test_...)",
  );

const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
const response = await fetch("https://api.razorpay.com/v1/orders?count=1", {
  headers: { Authorization: `Basic ${auth}` },
});
if (!response.ok)
  throw new Error(
    `Razorpay Test Mode authentication failed (${response.status})`,
  );
console.log("✅ Razorpay Test Mode credentials are valid");

const paymentId = process.env["RAZORPAY_TEST_PAYMENT_ID"];
if (paymentId) {
  const paymentResponse = await fetch(
    `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
    { headers: { Authorization: `Basic ${auth}` } },
  );
  if (!paymentResponse.ok)
    throw new Error(`Unable to fetch test payment (${paymentResponse.status})`);
  const payment = (await paymentResponse.json()) as {
    id: string;
    order_id: string;
    status: string;
    amount: number;
    currency: string;
  };
  console.log(
    JSON.stringify(
      {
        id: payment.id,
        orderId: payment.order_id,
        status: payment.status,
        amountPaise: payment.amount,
        currency: payment.currency,
      },
      null,
      2,
    ),
  );
  if (payment.status !== "captured" || payment.currency !== "INR")
    throw new Error("Test payment is not captured in INR");
  console.log(
    "✅ Razorpay Test payment is captured and can be used for end-to-end verification",
  );
}
