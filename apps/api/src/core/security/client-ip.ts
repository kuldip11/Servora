export const resolveClientIp = (
  headers: Record<string, string | undefined>,
  directIp: string | undefined,
  trustedProxyHops: number,
): string | undefined => {
  if (trustedProxyHops <= 0) return directIp;

  const forwarded = (headers["x-forwarded-for"] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (forwarded.length) {
    const index = Math.max(0, forwarded.length - trustedProxyHops);
    return forwarded[index];
  }

  return headers["x-real-ip"]?.trim() || directIp;
};
