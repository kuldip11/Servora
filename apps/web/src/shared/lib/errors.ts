import { extractApiError } from '@pos/api-client';

/**
 * Single source of truth for turning a thrown error (Axios error, native
 * Error, or unknown) into a user-facing message. Delegates to the
 * `@pos/api-client` extractor so the HTTP-specific logic (response.data.message
 * shape, etc.) lives in one place, and gives callers a spot to layer
 * app-specific fallbacks on top without repeating `err?.response?.data?.message`
 * throughout features.
 */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const message = extractApiError(error);
  return message && message !== 'Request failed' ? message : fallback;
}
