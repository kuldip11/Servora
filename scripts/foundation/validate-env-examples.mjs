import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = {
  "apps/api/.env.example": [
    "NODE_ENV",
    "PORT",
    "APP_VERSION",
    "CORS_ORIGIN",
    "RATE_LIMIT_MAX",
    "RATE_LIMIT_WINDOW_SECONDS",
    "DATABASE_URL",
    "JWT_SECRET",
  ],
  "apps/web/.env.example": [
    "VITE_API_URL",
    "VITE_WS_URL",
    "VITE_WEB_APP_URL",
    "VITE_KITCHEN_APP_URL",
    "VITE_WAITER_APP_URL",
    "VITE_CUSTOMER_APP_URL",
  ],
  "apps/waiter-app/.env.example": ["VITE_API_URL", "VITE_WS_URL"],
  "apps/kitchen-display/.env.example": ["VITE_API_URL", "VITE_WS_URL"],
  "apps/customer-app/.env.example": ["VITE_API_URL", "VITE_WS_URL"],
  "apps/website/.env.example": [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_APP_SIGNIN_URL",
    "NEXT_PUBLIC_WEB_APP_URL",
    "NEXT_PUBLIC_KITCHEN_APP_URL",
    "NEXT_PUBLIC_WAITER_APP_URL",
    "NEXT_PUBLIC_CUSTOMER_APP_URL",
    "LEAD_WEBHOOK_URL",
  ],
};

const errors = [];
for (const [relative, keys] of Object.entries(required)) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) {
    errors.push(`${relative}: file is missing`);
    continue;
  }
  const content = fs.readFileSync(file, "utf8");
  for (const key of keys) {
    if (!new RegExp(`^${key}=`, "m").test(content))
      errors.push(`${relative}: missing ${key}`);
  }
}

if (errors.length) {
  console.error("Environment example validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Environment examples are complete and standardized.");
