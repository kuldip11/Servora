# Phase 3.4 — Customer → Kitchen

- Dine-in QR orders publish the full newly fired kitchen ticket after order persistence.
- Public takeaway tickets remain `PENDING_PAYMENT` and are not exposed to KDS before verified payment.
- Verified takeaway payment releases pending tickets to `FIRED` and publishes full ticket payloads.
- KDS receives the same full `kitchen.ticket.created` contract regardless of whether the order originated from staff POS or customer QR.
- Tenant + branch scope is preserved by the realtime gateway.
