-- Clean schema baseline: 0010_kitchen

CREATE TABLE "kitchen_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"ticket_number" integer NOT NULL,
	"status" "kitchen_ticket_status" DEFAULT 'FIRED' NOT NULL,
	"notes" text,
	"fired_at" timestamp DEFAULT now() NOT NULL,
	"ready_at" timestamp,
	"served_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
