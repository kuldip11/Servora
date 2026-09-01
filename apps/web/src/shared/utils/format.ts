export const formatCurrency = (amount: number, currency = "INR"): string => {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(
    amount,
  );
};

export const formatDate = (
  date: string | Date,
  opts?: Intl.DateTimeFormatOptions,
): string => {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...opts,
  }).format(new Date(date));
};

export const formatTime = (date: string | Date): string => {
  const formatted = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));

  return formatted.replace(/\b(am|pm)\b/i, (match) => match.toUpperCase());
};
