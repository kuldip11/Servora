import { resolveAppUrls } from "@pos/config";

export const appUrls = resolveAppUrls({
  WEB_APP_URL: process.env.NEXT_PUBLIC_WEB_APP_URL,
  KITCHEN_APP_URL: process.env.NEXT_PUBLIC_KITCHEN_APP_URL,
  WAITER_APP_URL: process.env.NEXT_PUBLIC_WAITER_APP_URL,
  CUSTOMER_APP_URL: process.env.NEXT_PUBLIC_CUSTOMER_APP_URL,
});
