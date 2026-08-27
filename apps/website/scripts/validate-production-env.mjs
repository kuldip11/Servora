const required = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_APP_SIGNIN_URL",
  "LEAD_WEBHOOK_URL",
  "NEXT_PUBLIC_WEB_APP_URL",
  "NEXT_PUBLIC_KITCHEN_APP_URL",
  "NEXT_PUBLIC_WAITER_APP_URL",
  "NEXT_PUBLIC_CUSTOMER_APP_URL",
];

const placeholders = new Set([
  "https://servora.example",
  "https://app.servora.example/login",
  "https://example.com/your-lead-webhook",
]);

const missing = required.filter((name) => !process.env[name]);
const placeholder = required.filter((name) => placeholders.has(process.env[name]));

if (missing.length || placeholder.length) {
  console.error("Production configuration is incomplete.");
  if (missing.length) console.error(`Missing: ${missing.join(", ")}`);
  if (placeholder.length) console.error(`Placeholder values: ${placeholder.join(", ")}`);
  process.exit(1);
}

for (const name of required) {
  try {
    const url = new URL(process.env[name]);
    if (url.protocol !== "https:") throw new Error("must use HTTPS");
  } catch (error) {
    console.error(`${name} must be a valid HTTPS URL: ${error.message}`);
    process.exit(1);
  }
}

console.log("Production environment configuration looks valid.");
