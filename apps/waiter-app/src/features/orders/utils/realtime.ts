export const shouldApplyRealtime = (
  current?: { updatedAt?: string } | null,
  incoming?: { updatedAt?: string } | null,
) => {
  if (!current?.updatedAt || !incoming?.updatedAt) return true;
  return (
    new Date(incoming.updatedAt).getTime() >=
    new Date(current.updatedAt).getTime()
  );
};

export const mergeRealtimeTicket = <
  T extends { id: string; updatedAt?: string },
>(
  tickets: T[],
  incoming: T,
) =>
  tickets.map((ticket) =>
    ticket.id === incoming.id && shouldApplyRealtime(ticket, incoming)
      ? incoming
      : ticket,
  );
