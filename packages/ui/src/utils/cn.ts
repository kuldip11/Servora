import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Deliberately duplicated from each app's `lib/utils.ts` rather than
// imported from `apps/web`: a Tier 1 package (see
// docs/frontend/COMPONENT_GUIDE.md) must not depend on any single app's
// internals. This is the one small exception to "don't duplicate" that
// the frontend docs' migration approach explicitly allows for a
// mechanical, behavior-preserving extraction.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
