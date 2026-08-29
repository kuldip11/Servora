import { resolveAppUrls } from "@pos/config";

export const appUrls = resolveAppUrls({
  WEB_APP_URL: import.meta.env.VITE_WEB_APP_URL,
  KITCHEN_APP_URL: import.meta.env.VITE_KITCHEN_APP_URL,
  WAITER_APP_URL: import.meta.env.VITE_WAITER_APP_URL,
  CUSTOMER_APP_URL: import.meta.env.VITE_CUSTOMER_APP_URL,
});
