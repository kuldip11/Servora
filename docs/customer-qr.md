# Customer QR table management

## Purpose

Restaurant staff can open the Tables page, view a table's customer QR code, print it, and regenerate the token if a printed QR is compromised.

## Flow

1. A table is created with a server-generated opaque `publicQrToken`.
2. Tables page exposes a QR action for authorized staff.
3. The QR contains the customer app URL plus `?qr=<publicQrToken>`.
4. Customer app exchanges the token for a customer session.
5. Regenerating the QR invalidates the old token because only the current token is accepted by the customer-session flow.

## Configuration

Set `VITE_CUSTOMER_APP_URL` in the web app for production, for example:

```text
https://order.example.com
```

Without the variable, local development assumes the customer app is on the same host at port `5176`.

## Security

- The QR token is opaque and generated server-side.
- QR regeneration requires the authenticated `tables:update` permission.
- Branch authorization is enforced by the existing table authorization layer.
- Customer URLs do not contain tenant IDs, branch IDs, or database IDs.
- The token is not a substitute for staff authentication.
