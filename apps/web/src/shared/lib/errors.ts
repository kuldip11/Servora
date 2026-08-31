import { extractApiError } from "@pos/api-client";

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  const message = extractApiError(error);
  return message && message !== "Request failed" ? message : fallback;
}
