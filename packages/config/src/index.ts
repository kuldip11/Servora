export interface ServoraAppUrls {
  web: string;
  kitchen: string;
  waiter: string;
  customer: string;
}

export interface AppUrlEnv {
  WEB_APP_URL?: string;
  KITCHEN_APP_URL?: string;
  WAITER_APP_URL?: string;
  CUSTOMER_APP_URL?: string;
}

const fallback = (value: string | undefined, fallbackValue: string) =>
  value?.trim() || fallbackValue;

export const resolveAppUrls = (env: AppUrlEnv): ServoraAppUrls => {
  return {
    web: fallback(env.WEB_APP_URL, "/app"),
    kitchen: fallback(env.KITCHEN_APP_URL, "/kitchen"),
    waiter: fallback(env.WAITER_APP_URL, "/waiter"),
    customer: fallback(env.CUSTOMER_APP_URL, "/order"),
  };
};

export const assertHttpUrl = (value: string, name: string): string => {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${name} must use http or https`);
  }
  return value;
};
