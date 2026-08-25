-- Clean schema baseline: 0012_analytics

CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity" varchar(100) NOT NULL,
	"entity_id" uuid,
	"metadata" text DEFAULT '{}',
	"ip_address" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
