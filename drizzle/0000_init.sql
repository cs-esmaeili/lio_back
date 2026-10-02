CREATE TYPE "public"."AttributeUsage" AS ENUM('SPEC', 'VARIANT');--> statement-breakpoint
CREATE TYPE "public"."EntityType" AS ENUM('PRODUCT', 'CATEGORY', 'TAG', 'POST', 'BRAND', 'PAGE', 'HOME');--> statement-breakpoint
CREATE TYPE "public"."FilterType" AS ENUM('CHECKBOX', 'RADIO', 'SELECT', 'RANGE', 'TOGGLE', 'SEARCH');--> statement-breakpoint
CREATE TYPE "public"."FooterSectionType" AS ENUM('LINK', 'CATEGORY');--> statement-breakpoint
CREATE TYPE "public"."HeaderSectionType" AS ENUM('LINK', 'CATEGORY');--> statement-breakpoint
CREATE TYPE "public"."OrderStatus" AS ENUM('PENDING_PAYMENT', 'PAID', 'CANCELED', 'EXPIRED', 'SHIPPED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."OtpPurpose" AS ENUM('LOGIN', 'RESET_PASSWORD');--> statement-breakpoint
CREATE TYPE "public"."PageSectionLocation" AS ENUM('SLIDER', 'PRODUCT_LIST', 'AMAZING_PRODUCTS', 'BANNER', 'BANNER_3', 'BANNER_4', 'INTRODUCTION', 'HEADER', 'FOOTER', 'CONTACT', 'ABOUT');--> statement-breakpoint
CREATE TYPE "public"."PageSectionStatus" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."PageSectionType" AS ENUM('SLIDER', 'PRODUCT_LIST', 'BANNER', 'INTRODUCTION', 'HEADER', 'FOOTER', 'CONTACT', 'ABOUT');--> statement-breakpoint
CREATE TYPE "public"."PaymentStatus" AS ENUM('INITIATED', 'VERIFIED', 'FAILED', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."UserStatus" AS ENUM('ACTIVE', 'DISABLED', 'BANNED');--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"address" text NOT NULL,
	"postal_code" text NOT NULL,
	"is_main" boolean DEFAULT false NOT NULL,
	"user_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "about_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_id" integer NOT NULL,
	"header_title" text,
	"header_description" text,
	"header_file_id" integer,
	"history_title" text,
	"history_description" text,
	"founder_title" text,
	"founder_subtitle" text,
	"founder_description" text,
	"founder_file_id" integer,
	"founder_signature_file_id" integer,
	"statistics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attributes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"usage" "AttributeUsage" DEFAULT 'SPEC' NOT NULL,
	"filter_type" "FilterType" DEFAULT 'CHECKBOX' NOT NULL,
	"is_multi_select" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attribute_values" (
	"id" serial PRIMARY KEY NOT NULL,
	"attribute_id" integer NOT NULL,
	"value" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp (3) NOT NULL,
	"revoked_at" timestamp (3),
	"last_used_at" timestamp (3),
	"ip" text,
	"user_agent" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banner_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_id" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"button_title" text,
	"button_url" text,
	"desktop_file_id" integer NOT NULL,
	"tablet_file_id" integer NOT NULL,
	"mobile_file_id" integer NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"cart_id" integer NOT NULL,
	"variant_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"guest_token" uuid,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL,
	CONSTRAINT "carts_owner_check" CHECK ((("carts"."user_id" is not null)::int + ("carts"."guest_token" is not null)::int) = 1)
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"image_id" integer,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_forms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_id" integer NOT NULL,
	"address" text,
	"email" text,
	"support_hour" text,
	"map_lat" double precision,
	"map_lng" double precision,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category_attributes" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"attribute_id" integer NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"is_filterable" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"original_name" text NOT NULL,
	"stored_name" text NOT NULL,
	"path" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"uploader_id" integer,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "footer_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_id" integer NOT NULL,
	"type" "FooterSectionType" NOT NULL,
	"label" text,
	"url" text,
	"description" text,
	"file_id" integer,
	"category_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "header_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_id" integer NOT NULL,
	"type" "HeaderSectionType" NOT NULL,
	"label" text,
	"url" text,
	"category_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "introduction_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_id" integer NOT NULL,
	"titles" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"desktop_file_id" integer NOT NULL,
	"tablet_file_id" integer,
	"mobile_file_id" integer,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"province" text NOT NULL,
	"city" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otps" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"code_hash" text NOT NULL,
	"purpose" "OtpPurpose" DEFAULT 'LOGIN' NOT NULL,
	"expires_at" timestamp (3) NOT NULL,
	"used_at" timestamp (3),
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"variant_id" integer,
	"product_id" integer,
	"product_name" text NOT NULL,
	"product_slug" text NOT NULL,
	"sku" text NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"line_total" numeric(12, 2) NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"user_id" integer,
	"guest_token" uuid,
	"status" "OrderStatus" DEFAULT 'PENDING_PAYMENT' NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"discount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"shipping_cost" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"phone" text NOT NULL,
	"company" text,
	"province" text NOT NULL,
	"city" text NOT NULL,
	"address" text NOT NULL,
	"postal_code" text NOT NULL,
	"paid_at" timestamp (3),
	"canceled_at" timestamp (3),
	"tracking_code" text,
	"shipped_at" timestamp (3),
	"completed_at" timestamp (3),
	"expires_at" timestamp (3) NOT NULL,
	"paid_sms_sent_at" timestamp (3),
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL,
	CONSTRAINT "orders_owner_check" CHECK ((("orders"."user_id" is not null)::int + ("orders"."guest_token" is not null)::int) <= 1)
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" "EntityType" NOT NULL,
	"entity_id" integer,
	"slug" text,
	"meta_title" text,
	"meta_description" text,
	"canonical_url" text,
	"robots_index" boolean DEFAULT true NOT NULL,
	"robots_follow" boolean DEFAULT true NOT NULL,
	"og_title" text,
	"og_description" text,
	"og_type" text DEFAULT 'website' NOT NULL,
	"og_image" text,
	"twitter_card" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_id" integer,
	"type" "PageSectionType" NOT NULL,
	"location" "PageSectionLocation" NOT NULL,
	"title" text,
	"link" text,
	"sort_order" integer NOT NULL,
	"status" "PageSectionStatus" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"provider" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"authority" text,
	"status" "PaymentStatus" DEFAULT 'INITIATED' NOT NULL,
	"ref_id" text,
	"request_payload" jsonb,
	"verify_payload" jsonb,
	"verified_at" timestamp (3),
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_attribute_values" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"attribute_id" integer NOT NULL,
	"attribute_value_id" integer NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"product_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	CONSTRAINT "product_categories_pkey" PRIMARY KEY("product_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"file_id" integer NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_thumbnail" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_list_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_tags" (
	"product_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "product_tags_pkey" PRIMARY KEY("product_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"sku" text NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"compare_at_price" numeric(12, 2),
	"stock" integer DEFAULT 0 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	CONSTRAINT "role_permissions_pkey" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slider_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_id" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"desktop_file_id" integer NOT NULL,
	"tablet_file_id" integer NOT NULL,
	"mobile_file_id" integer NOT NULL,
	"url" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"image_id" integer,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"national_code" text,
	"name" text,
	"last_name" text,
	"password_hash" text,
	"status" "UserStatus" DEFAULT 'ACTIVE' NOT NULL,
	"role_id" integer NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "variant_attribute_values" (
	"variant_id" integer NOT NULL,
	"product_attribute_value_id" integer NOT NULL,
	CONSTRAINT "variant_attribute_values_pkey" PRIMARY KEY("variant_id","product_attribute_value_id")
);
--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "about_sections" ADD CONSTRAINT "about_sections_section_id_page_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."page_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "about_sections" ADD CONSTRAINT "about_sections_header_file_id_files_id_fk" FOREIGN KEY ("header_file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "about_sections" ADD CONSTRAINT "about_sections_founder_file_id_files_id_fk" FOREIGN KEY ("founder_file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "about_sections" ADD CONSTRAINT "about_sections_founder_signature_file_id_files_id_fk" FOREIGN KEY ("founder_signature_file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attribute_values" ADD CONSTRAINT "attribute_values_attribute_id_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banner_sections" ADD CONSTRAINT "banner_sections_section_id_page_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."page_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banner_sections" ADD CONSTRAINT "banner_sections_desktop_file_id_files_id_fk" FOREIGN KEY ("desktop_file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banner_sections" ADD CONSTRAINT "banner_sections_tablet_file_id_files_id_fk" FOREIGN KEY ("tablet_file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banner_sections" ADD CONSTRAINT "banner_sections_mobile_file_id_files_id_fk" FOREIGN KEY ("mobile_file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_image_id_files_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_sections" ADD CONSTRAINT "contact_sections_section_id_page_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."page_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_attribute_id_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "footer_sections" ADD CONSTRAINT "footer_sections_section_id_page_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."page_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "footer_sections" ADD CONSTRAINT "footer_sections_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "footer_sections" ADD CONSTRAINT "footer_sections_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "header_sections" ADD CONSTRAINT "header_sections_section_id_page_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."page_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "header_sections" ADD CONSTRAINT "header_sections_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "introduction_sections" ADD CONSTRAINT "introduction_sections_section_id_page_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."page_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "introduction_sections" ADD CONSTRAINT "introduction_sections_desktop_file_id_files_id_fk" FOREIGN KEY ("desktop_file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "introduction_sections" ADD CONSTRAINT "introduction_sections_tablet_file_id_files_id_fk" FOREIGN KEY ("tablet_file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "introduction_sections" ADD CONSTRAINT "introduction_sections_mobile_file_id_files_id_fk" FOREIGN KEY ("mobile_file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_sections" ADD CONSTRAINT "page_sections_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_attribute_id_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_attribute_value_id_attribute_values_id_fk" FOREIGN KEY ("attribute_value_id") REFERENCES "public"."attribute_values"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_list_sections" ADD CONSTRAINT "product_list_sections_section_id_page_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."page_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_list_sections" ADD CONSTRAINT "product_list_sections_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slider_sections" ADD CONSTRAINT "slider_sections_section_id_page_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."page_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slider_sections" ADD CONSTRAINT "slider_sections_desktop_file_id_files_id_fk" FOREIGN KEY ("desktop_file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slider_sections" ADD CONSTRAINT "slider_sections_tablet_file_id_files_id_fk" FOREIGN KEY ("tablet_file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slider_sections" ADD CONSTRAINT "slider_sections_mobile_file_id_files_id_fk" FOREIGN KEY ("mobile_file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_parent_id_tags_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_image_id_files_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_attribute_values" ADD CONSTRAINT "variant_attribute_values_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_attribute_values" ADD CONSTRAINT "variant_attribute_values_product_attribute_value_id_product_attribute_values_id_fk" FOREIGN KEY ("product_attribute_value_id") REFERENCES "public"."product_attribute_values"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "addresses_user_id_idx" ON "addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "addresses_location_id_idx" ON "addresses" USING btree ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "about_sections_section_id_key" ON "about_sections" USING btree ("section_id");--> statement-breakpoint
CREATE UNIQUE INDEX "attributes_name_key" ON "attributes" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "attribute_values_attribute_id_value_key" ON "attribute_values" USING btree ("attribute_id","value");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_sessions_token_hash_key" ON "auth_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "banner_sections_section_id_sort_order_idx" ON "banner_sections" USING btree ("section_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "cart_items_cart_id_variant_id_key" ON "cart_items" USING btree ("cart_id","variant_id");--> statement-breakpoint
CREATE INDEX "cart_items_cart_id_idx" ON "cart_items" USING btree ("cart_id");--> statement-breakpoint
CREATE INDEX "cart_items_variant_id_idx" ON "cart_items" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "carts_user_id_idx" ON "carts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "carts_user_id_key" ON "carts" USING btree ("user_id") WHERE "carts"."user_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "carts_guest_token_key" ON "carts" USING btree ("guest_token") WHERE "carts"."guest_token" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_key" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categories_parent_id_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "categories_image_id_idx" ON "categories" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "contact_forms_created_at_idx" ON "contact_forms" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "contact_sections_section_id_key" ON "contact_sections" USING btree ("section_id");--> statement-breakpoint
CREATE UNIQUE INDEX "category_attributes_category_id_attribute_id_key" ON "category_attributes" USING btree ("category_id","attribute_id");--> statement-breakpoint
CREATE INDEX "category_attributes_attribute_id_idx" ON "category_attributes" USING btree ("attribute_id");--> statement-breakpoint
CREATE UNIQUE INDEX "files_stored_name_key" ON "files" USING btree ("stored_name");--> statement-breakpoint
CREATE INDEX "files_uploader_id_idx" ON "files" USING btree ("uploader_id");--> statement-breakpoint
CREATE INDEX "footer_sections_section_id_sort_order_idx" ON "footer_sections" USING btree ("section_id","sort_order");--> statement-breakpoint
CREATE INDEX "header_sections_section_id_sort_order_idx" ON "header_sections" USING btree ("section_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "introduction_sections_section_id_key" ON "introduction_sections" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "locations_province_city_idx" ON "locations" USING btree ("province","city");--> statement-breakpoint
CREATE INDEX "otps_phone_created_at_idx" ON "otps" USING btree ("phone","created_at");--> statement-breakpoint
CREATE INDEX "otps_phone_purpose_idx" ON "otps" USING btree ("phone","purpose");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_variant_id_idx" ON "order_items" USING btree ("variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_guest_token_key" ON "orders" USING btree ("guest_token") WHERE "orders"."guest_token" is not null;--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_expires_at_idx" ON "orders" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pages_slug_key" ON "pages" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "pages_entity_type_entity_id_key" ON "pages" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "page_sections_page_id_status_sort_order_idx" ON "page_sections" USING btree ("page_id","status","sort_order");--> statement-breakpoint
CREATE INDEX "payments_order_id_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_authority_key" ON "payments" USING btree ("authority") WHERE "payments"."authority" is not null;--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_key" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "products_name_idx" ON "products" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "product_attribute_values_product_id_attribute_id_value_id_key" ON "product_attribute_values" USING btree ("product_id","attribute_id","attribute_value_id");--> statement-breakpoint
CREATE INDEX "product_attribute_values_attribute_id_idx" ON "product_attribute_values" USING btree ("attribute_id");--> statement-breakpoint
CREATE INDEX "product_attribute_values_attribute_value_id_idx" ON "product_attribute_values" USING btree ("attribute_value_id");--> statement-breakpoint
CREATE INDEX "product_categories_category_id_idx" ON "product_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "product_images_product_id_sort_order_idx" ON "product_images" USING btree ("product_id","sort_order");--> statement-breakpoint
CREATE INDEX "product_images_file_id_idx" ON "product_images" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "product_list_sections_section_id_sort_order_idx" ON "product_list_sections" USING btree ("section_id","sort_order");--> statement-breakpoint
CREATE INDEX "product_tags_tag_id_idx" ON "product_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "product_variants_product_id_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_name_key" ON "roles" USING btree ("name");--> statement-breakpoint
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "slider_sections_section_id_sort_order_idx" ON "slider_sections" USING btree ("section_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_slug_key" ON "tags" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tags_parent_id_idx" ON "tags" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "tags_image_id_idx" ON "tags" USING btree ("image_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_key" ON "users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "users_national_code_key" ON "users" USING btree ("national_code");--> statement-breakpoint
CREATE INDEX "users_role_id_idx" ON "users" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "variant_attribute_values_product_attribute_value_id_idx" ON "variant_attribute_values" USING btree ("product_attribute_value_id");