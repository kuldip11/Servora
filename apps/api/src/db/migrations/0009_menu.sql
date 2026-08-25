-- Clean schema baseline: 0007_menu

CREATE TABLE "holidays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"holiday_date" date NOT NULL,
	"region" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "menu_allergens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	CONSTRAINT "menu_allergens_name_unique" UNIQUE("name")
);

CREATE TABLE "menu_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid,
	"name" varchar(100) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "menu_item_allergens" (
	"menu_item_id" uuid NOT NULL,
	"allergen_id" uuid NOT NULL,
	CONSTRAINT "menu_item_allergens_menu_item_id_allergen_id_pk" PRIMARY KEY("menu_item_id","allergen_id")
);

CREATE TABLE "menu_item_branch_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"price" numeric(10, 2),
	"tax_rate" numeric(5, 2),
	"prep_time_minutes" integer,
	"status" "menu_item_status",
	"is_hidden" boolean DEFAULT false NOT NULL,
	"availability_reason" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "menu_item_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"url" varchar(500) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);

CREATE TABLE "menu_item_modifier_groups" (
	"menu_item_id" uuid NOT NULL,
	"modifier_group_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "menu_item_modifier_groups_menu_item_id_modifier_group_id_pk" PRIMARY KEY("menu_item_id","modifier_group_id")
);

CREATE TABLE "menu_item_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"branch_id" uuid,
	"schedule_type" "menu_item_schedule_type" NOT NULL,
	"start_time" time,
	"end_time" time,
	"day_of_week" integer,
	"start_date" date,
	"end_date" date,
	"holiday_name" varchar(255),
	"status_during_period" "menu_item_status" DEFAULT 'ACTIVE' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "menu_item_tags" (
	"menu_item_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "menu_item_tags_menu_item_id_tag_id_pk" PRIMARY KEY("menu_item_id","tag_id")
);

CREATE TABLE "menu_item_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL
);

CREATE TABLE "menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid,
	"category_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"base_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"image_url" varchar(500),
	"food_type" "food_type" DEFAULT 'VEG' NOT NULL,
	"spice_level" "spice_level",
	"sku" varchar(50),
	"prep_time_minutes" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"hsn_code" varchar(20),
	"status" "menu_item_status" DEFAULT 'ACTIVE' NOT NULL,
	"availability_reason" varchar(500),
	"status_changed_at" timestamp DEFAULT now() NOT NULL,
	"enable_recipe_deduction" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"published_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "menu_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"color" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "menu_template_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"base_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"food_type" "food_type" DEFAULT 'VEG' NOT NULL,
	"spice_level" "spice_level",
	"prep_time_minutes" integer,
	"hsn_code" varchar(20),
	"sort_order" integer DEFAULT 0 NOT NULL
);

CREATE TABLE "menu_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"source_category_name" varchar(200),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "modifier_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid,
	"name" varchar(100) NOT NULL,
	"selection_type" "modifier_selection_type" DEFAULT 'SINGLE' NOT NULL,
	"min_selections" integer DEFAULT 0 NOT NULL,
	"max_selections" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "modifier_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"modifier_group_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"additional_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"max_quantity" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
