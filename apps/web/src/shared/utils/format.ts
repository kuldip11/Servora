export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...opts,
  }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  const formatted = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));

  // Some ICU builds render the en-IN AM/PM marker in lowercase (e.g. "01:05 pm")
  // while others use uppercase. Normalize so output is consistent across environments.
  return formatted.replace(/\b(am|pm)\b/i, (match) => match.toUpperCase());
}
