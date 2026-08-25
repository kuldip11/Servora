-- Clean schema baseline: 0008_inventory

CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"unit" "inventory_unit" NOT NULL,
	"current_stock" numeric(12, 3) DEFAULT '0' NOT NULL,
	"minimum_stock" numeric(12, 3) DEFAULT '0' NOT NULL,
	"reorder_point" numeric(12, 3) DEFAULT '0' NOT NULL,
	"cost_per_unit" numeric(10, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "inventory_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"transaction_type" "inventory_transaction_type" NOT NULL,
	"quantity" numeric(12, 3) NOT NULL,
	"balance_before" numeric(12, 3) NOT NULL,
	"balance_after" numeric(12, 3) NOT NULL,
	"notes" text,
	"performed_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "order_inventory_deductions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"quantity_deducted" numeric(12, 3) NOT NULL,
	"unit" "inventory_unit" NOT NULL,
	"was_short" boolean DEFAULT false NOT NULL,
	"deducted_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"quantity_required" numeric(12, 3) NOT NULL,
	"unit" "inventory_unit" NOT NULL,
	"is_optional" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
