import { t } from 'elysia';

export const updateTicketStatusBody = t.Object({
  status: t.Union([
    t.Literal('FIRED'),
    t.Literal('PREPARING'),
    t.Literal('READY'),
    t.Literal('SERVED'),
  ]),
});

export const ticketIdParams = t.Object({
  id: t.String(),
});
