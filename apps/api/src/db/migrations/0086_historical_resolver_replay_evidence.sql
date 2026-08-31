-- H1: immutable raw resolver/pipeline inputs used for deterministic historical
-- replay. Nullable JSONB also supports non-menu grouping rows.
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "pricing_replay_evidence" jsonb;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "availability_replay_evidence" jsonb;
