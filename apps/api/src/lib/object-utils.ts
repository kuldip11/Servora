/**
 * Remove keys whose value is `undefined` from an object.
 *
 * With `exactOptionalPropertyTypes: true`, an optional property (`foo?: T`)
 * may be *omitted* but may not be explicitly assigned `undefined` — those are
 * different types under this flag. Drizzle's generated insert/update value
 * types are optional-property based, so spreading a partial-update object
 * (where every field is `T | undefined`) directly into `.values()`/`.set()`
 * fails to type-check even though it is safe at runtime. This helper bridges
 * the gap by actually deleting `undefined` entries, which matches the
 * "omitted" semantics the target types expect.
 */
export function compact<T extends Record<string, unknown>>(
  obj: T,
): { [K in keyof T]?: Exclude<T[K], undefined> } {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as { [K in keyof T]?: Exclude<T[K], undefined> };
}
