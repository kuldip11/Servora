-- Final enum values are present in 0000 for fresh databases. Keep this
-- idempotent declaration so the historical migration chain remains valid.
ALTER TYPE "kitchen_ticket_status" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
