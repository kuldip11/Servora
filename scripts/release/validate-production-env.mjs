const required = [
  "POSTGRES_PASSWORD",
  "REDIS_PASSWORD",
  "JWT_SECRET",
  "REFRESH_TOKEN_SECRET",
  "CORS_ORIGIN",
  "PUBLIC_API_URL",
  "PUBLIC_WS_URL",
  "PUBLIC_WEB_URL",
  "PUBLIC_KITCHEN_URL",
  "PUBLIC_WAITER_URL",
  "PUBLIC_CUSTOMER_URL",
  "PUBLIC_WEBSITE_URL",
  "LEAD_WEBHOOK_URL",
];

const placeholderPattern = /(replace-with|example\.com|change-this)/i;
const errors = [];

for (const key of required) {
  const value = process.env[key]?.trim();
  if (!value) {
    errors.push(`${key} is required`);
    continue;
  }
  if (placeholderPattern.test(value))
    errors.push(`${key} still contains a placeholder value`);
}

for (const key of [
  "JWT_SECRET",
  "REFRESH_TOKEN_SECRET",
  "POSTGRES_PASSWORD",
  "REDIS_PASSWORD",
]) {
  const value = process.env[key] ?? "";
  if (value && value.length < 32)
    errors.push(`${key} must be at least 32 characters`);
}

if (
  process.env.JWT_SECRET &&
  process.env.REFRESH_TOKEN_SECRET &&
  process.env.JWT_SECRET === process.env.REFRESH_TOKEN_SECRET
) {
  errors.push("JWT_SECRET and REFRESH_TOKEN_SECRET must be different");
}

for (const key of [
  "PUBLIC_API_URL",
  "PUBLIC_WEB_URL",
  "PUBLIC_KITCHEN_URL",
  "PUBLIC_WAITER_URL",
  "PUBLIC_CUSTOMER_URL",
  "PUBLIC_WEBSITE_URL",
  "LEAD_WEBHOOK_URL",
]) {
  const value = process.env[key];
  if (!value) continue;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") errors.push(`${key} must use HTTPS`);
  } catch {
    errors.push(`${key} must be a valid URL`);
  }
}

if (process.env.PUBLIC_WS_URL) {
  try {
    const url = new URL(process.env.PUBLIC_WS_URL);
    if (url.protocol !== "wss:") errors.push("PUBLIC_WS_URL must use WSS");
  } catch {
    errors.push("PUBLIC_WS_URL must be a valid URL");
  }
}

const cors = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((x) => x.trim())
  .filter(Boolean);
if (cors.includes("*")) errors.push("CORS_ORIGIN cannot contain wildcard *");
for (const origin of cors) {
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:")
      errors.push(`CORS origin must use HTTPS: ${origin}`);
  } catch {
    errors.push(`Invalid CORS origin: ${origin}`);
  }
}

if (errors.length) {
  console.error("Production environment validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Production environment validation passed.");
