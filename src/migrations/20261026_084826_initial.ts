import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('bn', 'en');
  CREATE TYPE "public"."enum_products_variants_unit" AS ENUM('g', 'kg', 'ml', 'l', 'pcs', 'jar', 'box', 'pack');
  CREATE TYPE "public"."enum_products_status" AS ENUM('published', 'draft');
  CREATE TYPE "public"."enum_products_translation_status" AS ENUM('complete', 'missing_en', 'missing_bn', 'missing_both');
  CREATE TYPE "public"."enum_categories_status" AS ENUM('published', 'draft');
  CREATE TYPE "public"."enum_categories_translation_status" AS ENUM('complete', 'missing_en', 'missing_bn', 'missing_both');
  CREATE TYPE "public"."enum_stock_adjustments_reason" AS ENUM('restock', 'correction', 'damage', 'return', 'order', 'order_cancel');
  CREATE TYPE "public"."enum_orders_district" AS ENUM('barguna', 'barishal', 'bhola', 'jhalokati', 'patuakhali', 'pirojpur', 'bandarban', 'brahmanbaria', 'chandpur', 'chattogram', 'cumilla', 'coxsbazar', 'feni', 'khagrachhari', 'lakshmipur', 'noakhali', 'rangamati', 'dhaka', 'faridpur', 'gazipur', 'gopalganj', 'kishoreganj', 'madaripur', 'manikganj', 'munshiganj', 'narayanganj', 'narsingdi', 'rajbari', 'shariatpur', 'tangail', 'bagerhat', 'chuadanga', 'jashore', 'jhenaidah', 'khulna', 'kushtia', 'magura', 'meherpur', 'narail', 'satkhira', 'jamalpur', 'mymensingh', 'netrokona', 'sherpur', 'bogura', 'chapainawabganj', 'joypurhat', 'naogaon', 'natore', 'pabna', 'rajshahi', 'sirajganj', 'dinajpur', 'gaibandha', 'kurigram', 'lalmonirhat', 'nilphamari', 'panchagarh', 'rangpur', 'thakurgaon', 'habiganj', 'moulvibazar', 'sunamganj', 'sylhet');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
  CREATE TYPE "public"."enum_orders_payment_status" AS ENUM('unpaid', 'pending', 'paid', 'failed', 'refunded', 'cancelled');
  CREATE TYPE "public"."enum_orders_payment_method" AS ENUM('cod', 'sslcommerz', 'bkash', 'nagad');
  CREATE TYPE "public"."enum_orders_locale" AS ENUM('bn', 'en');
  CREATE TYPE "public"."enum_payments_provider" AS ENUM('cod', 'sslcommerz', 'bkash', 'nagad');
  CREATE TYPE "public"."enum_payments_status" AS ENUM('initiated', 'succeeded', 'failed', 'cancelled');
  CREATE TYPE "public"."enum_customers_last_address_district" AS ENUM('barguna', 'barishal', 'bhola', 'jhalokati', 'patuakhali', 'pirojpur', 'bandarban', 'brahmanbaria', 'chandpur', 'chattogram', 'cumilla', 'coxsbazar', 'feni', 'khagrachhari', 'lakshmipur', 'noakhali', 'rangamati', 'dhaka', 'faridpur', 'gazipur', 'gopalganj', 'kishoreganj', 'madaripur', 'manikganj', 'munshiganj', 'narayanganj', 'narsingdi', 'rajbari', 'shariatpur', 'tangail', 'bagerhat', 'chuadanga', 'jashore', 'jhenaidah', 'khulna', 'kushtia', 'magura', 'meherpur', 'narail', 'satkhira', 'jamalpur', 'mymensingh', 'netrokona', 'sherpur', 'bogura', 'chapainawabganj', 'joypurhat', 'naogaon', 'natore', 'pabna', 'rajshahi', 'sirajganj', 'dinajpur', 'gaibandha', 'kurigram', 'lalmonirhat', 'nilphamari', 'panchagarh', 'rangpur', 'thakurgaon', 'habiganj', 'moulvibazar', 'sunamganj', 'sylhet');
  CREATE TYPE "public"."enum_coupons_type" AS ENUM('percent', 'fixed');
  CREATE TYPE "public"."enum_faqs_topic" AS ENUM('orders', 'delivery', 'packaging', 'payment', 'availability', 'returns');
  CREATE TYPE "public"."enum_faqs_status" AS ENUM('published', 'draft');
  CREATE TYPE "public"."enum_faqs_translation_status" AS ENUM('complete', 'missing_en', 'missing_bn', 'missing_both');
  CREATE TYPE "public"."enum_testimonials_moderation" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_posts_status" AS ENUM('published', 'draft');
  CREATE TYPE "public"."enum_posts_translation_status" AS ENUM('complete', 'missing_en', 'missing_bn', 'missing_both');
  CREATE TYPE "public"."enum_pages_kind" AS ENUM('info', 'policy');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('published', 'draft');
  CREATE TYPE "public"."enum_pages_translation_status" AS ENUM('complete', 'missing_en', 'missing_bn', 'missing_both');
  CREATE TYPE "public"."enum_redirects_type" AS ENUM('product', 'category', 'post', 'page');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'manager', 'editor');
  CREATE TYPE "public"."enum_homepage_benefits_icon" AS ENUM('leaf', 'package', 'truck', 'wallet', 'shield', 'phone', 'clock', 'heart');
  CREATE TYPE "public"."enum_homepage_announcement_tone" AS ENUM('green', 'mango', 'cream');
  CREATE TYPE "public"."enum_branding_socials_platform" AS ENUM('facebook', 'instagram', 'youtube', 'tiktok', 'linkedin', 'x');
  CREATE TYPE "public"."enum_contact_settings_show_on" AS ENUM('home', 'shop', 'category', 'product', 'cart', 'checkout', 'blog', 'pages', 'order');
  CREATE TYPE "public"."enum_contact_settings_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum_delivery_settings_zones_districts" AS ENUM('barguna', 'barishal', 'bhola', 'jhalokati', 'patuakhali', 'pirojpur', 'bandarban', 'brahmanbaria', 'chandpur', 'chattogram', 'cumilla', 'coxsbazar', 'feni', 'khagrachhari', 'lakshmipur', 'noakhali', 'rangamati', 'dhaka', 'faridpur', 'gazipur', 'gopalganj', 'kishoreganj', 'madaripur', 'manikganj', 'munshiganj', 'narayanganj', 'narsingdi', 'rajbari', 'shariatpur', 'tangail', 'bagerhat', 'chuadanga', 'jashore', 'jhenaidah', 'khulna', 'kushtia', 'magura', 'meherpur', 'narail', 'satkhira', 'jamalpur', 'mymensingh', 'netrokona', 'sherpur', 'bogura', 'chapainawabganj', 'joypurhat', 'naogaon', 'natore', 'pabna', 'rajshahi', 'sirajganj', 'dinajpur', 'gaibandha', 'kurigram', 'lalmonirhat', 'nilphamari', 'panchagarh', 'rangpur', 'thakurgaon', 'habiganj', 'moulvibazar', 'sunamganj', 'sylhet');
  CREATE TABLE "products_attributes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "products_attributes_locales" (
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "products_variants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"sku" varchar NOT NULL,
  	"pack_size" numeric,
  	"unit" "enum_products_variants_unit" DEFAULT 'kg',
  	"price" numeric NOT NULL,
  	"sale_price" numeric,
  	"sale_starts_at" timestamp(3) with time zone,
  	"sale_ends_at" timestamp(3) with time zone,
  	"stock" numeric DEFAULT 0,
  	"low_stock_threshold" numeric DEFAULT 5,
  	"weight_grams" numeric
  );
  
  CREATE TABLE "products_variants_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"seo_og_image_id" integer,
  	"seo_canonical_url" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"slug" varchar NOT NULL,
  	"status" "enum_products_status" DEFAULT 'draft' NOT NULL,
  	"featured" boolean DEFAULT false,
  	"best_seller" boolean DEFAULT false,
  	"is_bundle" boolean DEFAULT false,
  	"sort_order" numeric DEFAULT 0,
  	"translation_status" "enum_products_translation_status" DEFAULT 'missing_en',
  	"min_price" numeric,
  	"total_stock" numeric DEFAULT 0,
  	"search_text" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "products_locales" (
  	"name" varchar NOT NULL,
  	"short_description" varchar,
  	"description" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_focus_keyword" varchar,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "products_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"categories_id" integer,
  	"products_id" integer
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"banner_id" integer,
  	"seo_og_image_id" integer,
  	"seo_canonical_url" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"slug" varchar NOT NULL,
  	"status" "enum_categories_status" DEFAULT 'published' NOT NULL,
  	"parent_id" integer,
  	"featured" boolean DEFAULT false,
  	"sort_order" numeric DEFAULT 0,
  	"translation_status" "enum_categories_translation_status" DEFAULT 'missing_en',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories_locales" (
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_focus_keyword" varchar,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "stock_adjustments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"sku" varchar NOT NULL,
  	"delta" numeric NOT NULL,
  	"reason" "enum_stock_adjustments_reason" DEFAULT 'restock' NOT NULL,
  	"note" varchar,
  	"product_id" integer,
  	"variant_id" varchar,
  	"order_id" integer,
  	"stock_before" numeric,
  	"stock_after" numeric,
  	"created_by" varchar,
  	"system_generated" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer,
  	"product_name" varchar NOT NULL,
  	"product_name_en" varchar,
  	"variant_id" varchar,
  	"variant_label" varchar,
  	"sku" varchar,
  	"unit_price" numeric NOT NULL,
  	"regular_price" numeric,
  	"quantity" numeric NOT NULL,
  	"line_total" numeric NOT NULL
  );
  
  CREATE TABLE "orders_status_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"status" varchar,
  	"payment_status" varchar,
  	"at" timestamp(3) with time zone,
  	"by" varchar,
  	"note" varchar
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"subtotal" numeric NOT NULL,
  	"discount" numeric DEFAULT 0,
  	"shipping_fee" numeric DEFAULT 0,
  	"total" numeric NOT NULL,
  	"coupon_code" varchar,
  	"delivery_method" varchar,
  	"delivery_zone" varchar,
  	"customer_name" varchar NOT NULL,
  	"customer_phone" varchar NOT NULL,
  	"customer_email" varchar,
  	"division" varchar,
  	"district" "enum_orders_district",
  	"area" varchar,
  	"address" varchar NOT NULL,
  	"customer_notes" varchar,
  	"customer_id" integer,
  	"order_number" varchar NOT NULL,
  	"status" "enum_orders_status" DEFAULT 'pending' NOT NULL,
  	"payment_status" "enum_orders_payment_status" DEFAULT 'unpaid' NOT NULL,
  	"payment_method" "enum_orders_payment_method" NOT NULL,
  	"status_note" varchar,
  	"admin_notes" varchar,
  	"locale" "enum_orders_locale" DEFAULT 'bn',
  	"idempotency_key" varchar,
  	"stock_restored" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_id" integer NOT NULL,
  	"reference" varchar NOT NULL,
  	"provider" "enum_payments_provider" NOT NULL,
  	"amount" numeric NOT NULL,
  	"currency" varchar DEFAULT 'BDT',
  	"status" "enum_payments_status" DEFAULT 'initiated' NOT NULL,
  	"transaction_id" varchar,
  	"gateway_payment_id" varchar,
  	"verified_at" timestamp(3) with time zone,
  	"failure_reason" varchar,
  	"gateway_response" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "customers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"email" varchar,
  	"last_address_division" varchar,
  	"last_address_district" "enum_customers_last_address_district",
  	"last_address_area" varchar,
  	"last_address_address" varchar,
  	"order_count" numeric DEFAULT 0,
  	"total_spent" numeric DEFAULT 0,
  	"last_order_at" timestamp(3) with time zone,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "coupons" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"description" varchar,
  	"active" boolean DEFAULT true,
  	"type" "enum_coupons_type" DEFAULT 'percent' NOT NULL,
  	"percent" numeric,
  	"amount" numeric,
  	"min_subtotal" numeric,
  	"max_discount" numeric,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"usage_limit" numeric,
  	"used_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"credit" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_large_url" varchar,
  	"sizes_large_width" numeric,
  	"sizes_large_height" numeric,
  	"sizes_large_mime_type" varchar,
  	"sizes_large_filesize" numeric,
  	"sizes_large_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "faqs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"topic" "enum_faqs_topic" DEFAULT 'orders',
  	"show_on_home" boolean DEFAULT true,
  	"sort_order" numeric DEFAULT 0,
  	"status" "enum_faqs_status" DEFAULT 'published' NOT NULL,
  	"translation_status" "enum_faqs_translation_status" DEFAULT 'missing_en',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "faqs_locales" (
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "testimonials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"customer_name" varchar NOT NULL,
  	"rating" numeric,
  	"product_id" integer,
  	"order_id" integer,
  	"moderation" "enum_testimonials_moderation" DEFAULT 'pending' NOT NULL,
  	"consent_to_publish" boolean DEFAULT false,
  	"source" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "testimonials_locales" (
  	"location" varchar,
  	"quote" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"cover_image_id" integer,
  	"seo_og_image_id" integer,
  	"seo_canonical_url" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"slug" varchar NOT NULL,
  	"status" "enum_posts_status" DEFAULT 'draft' NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"author" varchar,
  	"translation_status" "enum_posts_translation_status" DEFAULT 'missing_en',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "posts_locales" (
  	"title" varchar NOT NULL,
  	"excerpt" varchar,
  	"content" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_focus_keyword" varchar,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"seo_og_image_id" integer,
  	"seo_canonical_url" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"slug" varchar NOT NULL,
  	"kind" "enum_pages_kind" DEFAULT 'info',
  	"status" "enum_pages_status" DEFAULT 'published' NOT NULL,
  	"translation_status" "enum_pages_translation_status" DEFAULT 'missing_en',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pages_locales" (
  	"title" varchar NOT NULL,
  	"intro" varchar,
  	"content" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_focus_keyword" varchar,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "redirects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_redirects_type" NOT NULL,
  	"from_slug" varchar NOT NULL,
  	"to_slug" varchar NOT NULL,
  	"automatic" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer,
  	"categories_id" integer,
  	"stock_adjustments_id" integer,
  	"orders_id" integer,
  	"payments_id" integer,
  	"customers_id" integer,
  	"coupons_id" integer,
  	"media_id" integer,
  	"faqs_id" integer,
  	"testimonials_id" integer,
  	"posts_id" integer,
  	"pages_id" integer,
  	"redirects_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "homepage_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_homepage_benefits_icon" DEFAULT 'leaf'
  );
  
  CREATE TABLE "homepage_benefits_locales" (
  	"title" varchar NOT NULL,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"announcement_enabled" boolean DEFAULT true,
  	"announcement_href" varchar,
  	"announcement_tone" "enum_homepage_announcement_tone" DEFAULT 'green',
  	"hero_image_id" integer,
  	"hero_primary_cta_href" varchar,
  	"hero_secondary_cta_href" varchar,
  	"hero_seasonal_badge_enabled" boolean DEFAULT true,
  	"categories_section_enabled" boolean DEFAULT true,
  	"featured_enabled" boolean DEFAULT true,
  	"featured_category_id" integer,
  	"featured_limit" numeric DEFAULT 8,
  	"featured_cta_href" varchar,
  	"traditional_enabled" boolean DEFAULT true,
  	"traditional_per_category" numeric DEFAULT 4,
  	"popular_enabled" boolean DEFAULT true,
  	"promo_enabled" boolean DEFAULT true,
  	"promo_image_id" integer,
  	"promo_cta_href" varchar,
  	"story_enabled" boolean DEFAULT true,
  	"story_image_id" integer,
  	"story_cta_href" varchar,
  	"testimonials_enabled" boolean DEFAULT true,
  	"faq_enabled" boolean DEFAULT true,
  	"seo_og_image_id" integer,
  	"seo_canonical_url" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "homepage_locales" (
  	"announcement_text" varchar,
  	"hero_headline" varchar NOT NULL,
  	"hero_subheadline" varchar,
  	"hero_primary_cta_label" varchar,
  	"hero_secondary_cta_label" varchar,
  	"hero_seasonal_badge_text" varchar,
  	"categories_section_heading" varchar,
  	"featured_heading" varchar,
  	"featured_intro" varchar,
  	"featured_cta_label" varchar,
  	"traditional_heading" varchar,
  	"traditional_intro" varchar,
  	"popular_heading" varchar,
  	"promo_heading" varchar,
  	"promo_text" varchar,
  	"promo_cta_label" varchar,
  	"story_heading" varchar,
  	"story_body" varchar,
  	"story_cta_label" varchar,
  	"testimonials_heading" varchar,
  	"faq_heading" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_focus_keyword" varchar,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "homepage_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer,
  	"products_id" integer
  );
  
  CREATE TABLE "branding_socials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_branding_socials_platform" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "branding" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"logo_mobile_id" integer,
  	"logo_footer_id" integer,
  	"favicon_id" integer,
  	"colors_primary" varchar DEFAULT '#245B32',
  	"colors_secondary" varchar DEFAULT '#477B3B',
  	"colors_accent" varchar DEFAULT '#FFC928',
  	"colors_accent_warm" varchar DEFAULT '#F59A23',
  	"colors_background" varchar DEFAULT '#FFF9ED',
  	"colors_text" varchar DEFAULT '#243126',
  	"default_share_image_id" integer,
  	"phone" varchar,
  	"email" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "branding_locales" (
  	"brand_name" varchar DEFAULT 'আম্রকুঞ্জ' NOT NULL,
  	"tagline" varchar,
  	"site_title" varchar NOT NULL,
  	"default_seo_title" varchar,
  	"default_seo_description" varchar,
  	"address" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "contact_settings_show_on" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_contact_settings_show_on",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "contact_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"whatsapp_enabled" boolean DEFAULT true,
  	"whatsapp_number" varchar,
  	"message_bn" varchar DEFAULT 'আসসালামু আলাইকুম! আমি আপনাদের পণ্য সম্পর্কে জানতে চাই।',
  	"message_en" varchar DEFAULT 'Hello! I''d like to know more about your products.',
  	"position" "enum_contact_settings_position" DEFAULT 'right',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "contact_settings_locales" (
  	"tooltip" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "navigation_header_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_header_links_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_footer_columns_links_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "navigation_footer_columns_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "navigation_locales" (
  	"footer_description" varchar,
  	"payment_note" varchar,
  	"copyright" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "delivery_settings_zones_districts" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_delivery_settings_zones_districts",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "delivery_settings_zones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"is_default" boolean DEFAULT false,
  	"fee" numeric NOT NULL,
  	"free_over" numeric
  );
  
  CREATE TABLE "delivery_settings_zones_locales" (
  	"name" varchar NOT NULL,
  	"estimate" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "delivery_settings_methods" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"surcharge" numeric DEFAULT 0,
  	"enabled" boolean DEFAULT true
  );
  
  CREATE TABLE "delivery_settings_methods_locales" (
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "delivery_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "delivery_settings_locales" (
  	"product_page_note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payment_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"cod_enabled" boolean DEFAULT true,
  	"cod_max_total" numeric,
  	"sslcommerz_enabled" boolean DEFAULT false,
  	"bkash_enabled" boolean DEFAULT false,
  	"nagad_enabled" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payment_settings_locales" (
  	"checkout_note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "analytics_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ga4_id" varchar,
  	"gtm_id" varchar,
  	"search_console_verification" varchar,
  	"require_consent" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "products_attributes" ADD CONSTRAINT "products_attributes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_attributes_locales" ADD CONSTRAINT "products_attributes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products_attributes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_variants" ADD CONSTRAINT "products_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_variants_locales" ADD CONSTRAINT "products_variants_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_locales" ADD CONSTRAINT "products_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_texts" ADD CONSTRAINT "products_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_banner_id_media_id_fk" FOREIGN KEY ("banner_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_status_history" ADD CONSTRAINT "orders_status_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "faqs_locales" ADD CONSTRAINT "faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonials_locales" ADD CONSTRAINT "testimonials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_locales" ADD CONSTRAINT "posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stock_adjustments_fk" FOREIGN KEY ("stock_adjustments_id") REFERENCES "public"."stock_adjustments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payments_fk" FOREIGN KEY ("payments_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customers_fk" FOREIGN KEY ("customers_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_coupons_fk" FOREIGN KEY ("coupons_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_benefits" ADD CONSTRAINT "homepage_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_benefits_locales" ADD CONSTRAINT "homepage_benefits_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_benefits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_featured_category_id_categories_id_fk" FOREIGN KEY ("featured_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_promo_image_id_media_id_fk" FOREIGN KEY ("promo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_story_image_id_media_id_fk" FOREIGN KEY ("story_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_locales" ADD CONSTRAINT "homepage_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "branding_socials" ADD CONSTRAINT "branding_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."branding"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "branding" ADD CONSTRAINT "branding_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "branding" ADD CONSTRAINT "branding_logo_mobile_id_media_id_fk" FOREIGN KEY ("logo_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "branding" ADD CONSTRAINT "branding_logo_footer_id_media_id_fk" FOREIGN KEY ("logo_footer_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "branding" ADD CONSTRAINT "branding_favicon_id_media_id_fk" FOREIGN KEY ("favicon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "branding" ADD CONSTRAINT "branding_default_share_image_id_media_id_fk" FOREIGN KEY ("default_share_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "branding_locales" ADD CONSTRAINT "branding_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."branding"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contact_settings_show_on" ADD CONSTRAINT "contact_settings_show_on_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."contact_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contact_settings_locales" ADD CONSTRAINT "contact_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contact_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_header_links" ADD CONSTRAINT "navigation_header_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_header_links_locales" ADD CONSTRAINT "navigation_header_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_header_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_columns_links" ADD CONSTRAINT "navigation_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_columns_links_locales" ADD CONSTRAINT "navigation_footer_columns_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_footer_columns_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_columns" ADD CONSTRAINT "navigation_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_columns_locales" ADD CONSTRAINT "navigation_footer_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_locales" ADD CONSTRAINT "navigation_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "delivery_settings_zones_districts" ADD CONSTRAINT "delivery_settings_zones_districts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."delivery_settings_zones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "delivery_settings_zones" ADD CONSTRAINT "delivery_settings_zones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."delivery_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "delivery_settings_zones_locales" ADD CONSTRAINT "delivery_settings_zones_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."delivery_settings_zones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "delivery_settings_methods" ADD CONSTRAINT "delivery_settings_methods_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."delivery_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "delivery_settings_methods_locales" ADD CONSTRAINT "delivery_settings_methods_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."delivery_settings_methods"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "delivery_settings_locales" ADD CONSTRAINT "delivery_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."delivery_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payment_settings_locales" ADD CONSTRAINT "payment_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payment_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_attributes_order_idx" ON "products_attributes" USING btree ("_order");
  CREATE INDEX "products_attributes_parent_id_idx" ON "products_attributes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "products_attributes_locales_locale_parent_id_unique" ON "products_attributes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "products_attributes_locales_parent_id_idx" ON "products_attributes_locales" USING btree ("_parent_id");
  CREATE INDEX "products_variants_order_idx" ON "products_variants" USING btree ("_order");
  CREATE INDEX "products_variants_parent_id_idx" ON "products_variants" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "products_variants_locales_locale_parent_id_unique" ON "products_variants_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "products_variants_locales_parent_id_idx" ON "products_variants_locales" USING btree ("_parent_id");
  CREATE INDEX "products_seo_seo_og_image_idx" ON "products" USING btree ("seo_og_image_id");
  CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");
  CREATE INDEX "products_status_idx" ON "products" USING btree ("status");
  CREATE INDEX "products_total_stock_idx" ON "products" USING btree ("total_stock");
  CREATE INDEX "products_search_text_idx" ON "products" USING btree ("search_text");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE UNIQUE INDEX "products_locales_locale_parent_id_unique" ON "products_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "products_locales_parent_id_idx" ON "products_locales" USING btree ("_parent_id");
  CREATE INDEX "products_texts_order_parent" ON "products_texts" USING btree ("order","parent_id");
  CREATE INDEX "products_rels_order_idx" ON "products_rels" USING btree ("order");
  CREATE INDEX "products_rels_parent_idx" ON "products_rels" USING btree ("parent_id");
  CREATE INDEX "products_rels_path_idx" ON "products_rels" USING btree ("path");
  CREATE INDEX "products_rels_media_id_idx" ON "products_rels" USING btree ("media_id");
  CREATE INDEX "products_rels_categories_id_idx" ON "products_rels" USING btree ("categories_id");
  CREATE INDEX "products_rels_products_id_idx" ON "products_rels" USING btree ("products_id");
  CREATE INDEX "categories_image_idx" ON "categories" USING btree ("image_id");
  CREATE INDEX "categories_banner_idx" ON "categories" USING btree ("banner_id");
  CREATE INDEX "categories_seo_seo_og_image_idx" ON "categories" USING btree ("seo_og_image_id");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "categories_locales_locale_parent_id_unique" ON "categories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "categories_locales_parent_id_idx" ON "categories_locales" USING btree ("_parent_id");
  CREATE INDEX "stock_adjustments_sku_idx" ON "stock_adjustments" USING btree ("sku");
  CREATE INDEX "stock_adjustments_product_idx" ON "stock_adjustments" USING btree ("product_id");
  CREATE INDEX "stock_adjustments_order_idx" ON "stock_adjustments" USING btree ("order_id");
  CREATE INDEX "stock_adjustments_updated_at_idx" ON "stock_adjustments" USING btree ("updated_at");
  CREATE INDEX "stock_adjustments_created_at_idx" ON "stock_adjustments" USING btree ("created_at");
  CREATE INDEX "orders_items_order_idx" ON "orders_items" USING btree ("_order");
  CREATE INDEX "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
  CREATE INDEX "orders_items_product_idx" ON "orders_items" USING btree ("product_id");
  CREATE INDEX "orders_status_history_order_idx" ON "orders_status_history" USING btree ("_order");
  CREATE INDEX "orders_status_history_parent_id_idx" ON "orders_status_history" USING btree ("_parent_id");
  CREATE INDEX "orders_customer_phone_idx" ON "orders" USING btree ("customer_phone");
  CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");
  CREATE UNIQUE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");
  CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");
  CREATE INDEX "orders_payment_status_idx" ON "orders" USING btree ("payment_status");
  CREATE UNIQUE INDEX "orders_idempotency_key_idx" ON "orders" USING btree ("idempotency_key");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE INDEX "payments_order_idx" ON "payments" USING btree ("order_id");
  CREATE UNIQUE INDEX "payments_reference_idx" ON "payments" USING btree ("reference");
  CREATE INDEX "payments_transaction_id_idx" ON "payments" USING btree ("transaction_id");
  CREATE INDEX "payments_gateway_payment_id_idx" ON "payments" USING btree ("gateway_payment_id");
  CREATE INDEX "payments_updated_at_idx" ON "payments" USING btree ("updated_at");
  CREATE INDEX "payments_created_at_idx" ON "payments" USING btree ("created_at");
  CREATE UNIQUE INDEX "customers_phone_idx" ON "customers" USING btree ("phone");
  CREATE INDEX "customers_updated_at_idx" ON "customers" USING btree ("updated_at");
  CREATE INDEX "customers_created_at_idx" ON "customers" USING btree ("created_at");
  CREATE UNIQUE INDEX "coupons_code_idx" ON "coupons" USING btree ("code");
  CREATE INDEX "coupons_updated_at_idx" ON "coupons" USING btree ("updated_at");
  CREATE INDEX "coupons_created_at_idx" ON "coupons" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_large_sizes_large_filename_idx" ON "media" USING btree ("sizes_large_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "media_locales_parent_id_idx" ON "media_locales" USING btree ("_parent_id");
  CREATE INDEX "faqs_status_idx" ON "faqs" USING btree ("status");
  CREATE INDEX "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "faqs" USING btree ("created_at");
  CREATE UNIQUE INDEX "faqs_locales_locale_parent_id_unique" ON "faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "faqs_locales_parent_id_idx" ON "faqs_locales" USING btree ("_parent_id");
  CREATE INDEX "testimonials_product_idx" ON "testimonials" USING btree ("product_id");
  CREATE INDEX "testimonials_order_idx" ON "testimonials" USING btree ("order_id");
  CREATE INDEX "testimonials_updated_at_idx" ON "testimonials" USING btree ("updated_at");
  CREATE INDEX "testimonials_created_at_idx" ON "testimonials" USING btree ("created_at");
  CREATE UNIQUE INDEX "testimonials_locales_locale_parent_id_unique" ON "testimonials_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "testimonials_locales_parent_id_idx" ON "testimonials_locales" USING btree ("_parent_id");
  CREATE INDEX "posts_cover_image_idx" ON "posts" USING btree ("cover_image_id");
  CREATE INDEX "posts_seo_seo_og_image_idx" ON "posts" USING btree ("seo_og_image_id");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX "posts_status_idx" ON "posts" USING btree ("status");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE UNIQUE INDEX "posts_locales_locale_parent_id_unique" ON "posts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "posts_locales_parent_id_idx" ON "posts_locales" USING btree ("_parent_id");
  CREATE INDEX "posts_rels_order_idx" ON "posts_rels" USING btree ("order");
  CREATE INDEX "posts_rels_parent_idx" ON "posts_rels" USING btree ("parent_id");
  CREATE INDEX "posts_rels_path_idx" ON "posts_rels" USING btree ("path");
  CREATE INDEX "posts_rels_products_id_idx" ON "posts_rels" USING btree ("products_id");
  CREATE INDEX "pages_seo_seo_og_image_idx" ON "pages" USING btree ("seo_og_image_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_status_idx" ON "pages" USING btree ("status");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_locales_parent_id_idx" ON "pages_locales" USING btree ("_parent_id");
  CREATE INDEX "redirects_from_slug_idx" ON "redirects" USING btree ("from_slug");
  CREATE INDEX "redirects_updated_at_idx" ON "redirects" USING btree ("updated_at");
  CREATE INDEX "redirects_created_at_idx" ON "redirects" USING btree ("created_at");
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_stock_adjustments_id_idx" ON "payload_locked_documents_rels" USING btree ("stock_adjustments_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_payments_id_idx" ON "payload_locked_documents_rels" USING btree ("payments_id");
  CREATE INDEX "payload_locked_documents_rels_customers_id_idx" ON "payload_locked_documents_rels" USING btree ("customers_id");
  CREATE INDEX "payload_locked_documents_rels_coupons_id_idx" ON "payload_locked_documents_rels" USING btree ("coupons_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");
  CREATE INDEX "payload_locked_documents_rels_testimonials_id_idx" ON "payload_locked_documents_rels" USING btree ("testimonials_id");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_redirects_id_idx" ON "payload_locked_documents_rels" USING btree ("redirects_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "homepage_benefits_order_idx" ON "homepage_benefits" USING btree ("_order");
  CREATE INDEX "homepage_benefits_parent_id_idx" ON "homepage_benefits" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "homepage_benefits_locales_locale_parent_id_unique" ON "homepage_benefits_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_benefits_locales_parent_id_idx" ON "homepage_benefits_locales" USING btree ("_parent_id");
  CREATE INDEX "homepage_hero_hero_image_idx" ON "homepage" USING btree ("hero_image_id");
  CREATE INDEX "homepage_featured_featured_category_idx" ON "homepage" USING btree ("featured_category_id");
  CREATE INDEX "homepage_promo_promo_image_idx" ON "homepage" USING btree ("promo_image_id");
  CREATE INDEX "homepage_story_story_image_idx" ON "homepage" USING btree ("story_image_id");
  CREATE INDEX "homepage_seo_seo_og_image_idx" ON "homepage" USING btree ("seo_og_image_id");
  CREATE UNIQUE INDEX "homepage_locales_locale_parent_id_unique" ON "homepage_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_locales_parent_id_idx" ON "homepage_locales" USING btree ("_parent_id");
  CREATE INDEX "homepage_rels_order_idx" ON "homepage_rels" USING btree ("order");
  CREATE INDEX "homepage_rels_parent_idx" ON "homepage_rels" USING btree ("parent_id");
  CREATE INDEX "homepage_rels_path_idx" ON "homepage_rels" USING btree ("path");
  CREATE INDEX "homepage_rels_categories_id_idx" ON "homepage_rels" USING btree ("categories_id");
  CREATE INDEX "homepage_rels_products_id_idx" ON "homepage_rels" USING btree ("products_id");
  CREATE INDEX "branding_socials_order_idx" ON "branding_socials" USING btree ("_order");
  CREATE INDEX "branding_socials_parent_id_idx" ON "branding_socials" USING btree ("_parent_id");
  CREATE INDEX "branding_logo_idx" ON "branding" USING btree ("logo_id");
  CREATE INDEX "branding_logo_mobile_idx" ON "branding" USING btree ("logo_mobile_id");
  CREATE INDEX "branding_logo_footer_idx" ON "branding" USING btree ("logo_footer_id");
  CREATE INDEX "branding_favicon_idx" ON "branding" USING btree ("favicon_id");
  CREATE INDEX "branding_default_share_image_idx" ON "branding" USING btree ("default_share_image_id");
  CREATE UNIQUE INDEX "branding_locales_locale_parent_id_unique" ON "branding_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "branding_locales_parent_id_idx" ON "branding_locales" USING btree ("_parent_id");
  CREATE INDEX "contact_settings_show_on_order_idx" ON "contact_settings_show_on" USING btree ("order");
  CREATE INDEX "contact_settings_show_on_parent_idx" ON "contact_settings_show_on" USING btree ("parent_id");
  CREATE UNIQUE INDEX "contact_settings_locales_locale_parent_id_unique" ON "contact_settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "contact_settings_locales_parent_id_idx" ON "contact_settings_locales" USING btree ("_parent_id");
  CREATE INDEX "navigation_header_links_order_idx" ON "navigation_header_links" USING btree ("_order");
  CREATE INDEX "navigation_header_links_parent_id_idx" ON "navigation_header_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_header_links_locales_locale_parent_id_unique" ON "navigation_header_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_header_links_locales_parent_id_idx" ON "navigation_header_links_locales" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_columns_links_order_idx" ON "navigation_footer_columns_links" USING btree ("_order");
  CREATE INDEX "navigation_footer_columns_links_parent_id_idx" ON "navigation_footer_columns_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_footer_columns_links_locales_locale_parent_id_uni" ON "navigation_footer_columns_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_footer_columns_links_locales_parent_id_idx" ON "navigation_footer_columns_links_locales" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_columns_order_idx" ON "navigation_footer_columns" USING btree ("_order");
  CREATE INDEX "navigation_footer_columns_parent_id_idx" ON "navigation_footer_columns" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_footer_columns_locales_locale_parent_id_unique" ON "navigation_footer_columns_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_footer_columns_locales_parent_id_idx" ON "navigation_footer_columns_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_locales_locale_parent_id_unique" ON "navigation_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_locales_parent_id_idx" ON "navigation_locales" USING btree ("_parent_id");
  CREATE INDEX "delivery_settings_zones_districts_order_idx" ON "delivery_settings_zones_districts" USING btree ("order");
  CREATE INDEX "delivery_settings_zones_districts_parent_idx" ON "delivery_settings_zones_districts" USING btree ("parent_id");
  CREATE INDEX "delivery_settings_zones_order_idx" ON "delivery_settings_zones" USING btree ("_order");
  CREATE INDEX "delivery_settings_zones_parent_id_idx" ON "delivery_settings_zones" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "delivery_settings_zones_locales_locale_parent_id_unique" ON "delivery_settings_zones_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "delivery_settings_zones_locales_parent_id_idx" ON "delivery_settings_zones_locales" USING btree ("_parent_id");
  CREATE INDEX "delivery_settings_methods_order_idx" ON "delivery_settings_methods" USING btree ("_order");
  CREATE INDEX "delivery_settings_methods_parent_id_idx" ON "delivery_settings_methods" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "delivery_settings_methods_locales_locale_parent_id_unique" ON "delivery_settings_methods_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "delivery_settings_methods_locales_parent_id_idx" ON "delivery_settings_methods_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "delivery_settings_locales_locale_parent_id_unique" ON "delivery_settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "delivery_settings_locales_parent_id_idx" ON "delivery_settings_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "payment_settings_locales_locale_parent_id_unique" ON "payment_settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "payment_settings_locales_parent_id_idx" ON "payment_settings_locales" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "products_attributes" CASCADE;
  DROP TABLE "products_attributes_locales" CASCADE;
  DROP TABLE "products_variants" CASCADE;
  DROP TABLE "products_variants_locales" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "products_locales" CASCADE;
  DROP TABLE "products_texts" CASCADE;
  DROP TABLE "products_rels" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "categories_locales" CASCADE;
  DROP TABLE "stock_adjustments" CASCADE;
  DROP TABLE "orders_items" CASCADE;
  DROP TABLE "orders_status_history" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "payments" CASCADE;
  DROP TABLE "customers" CASCADE;
  DROP TABLE "coupons" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "faqs" CASCADE;
  DROP TABLE "faqs_locales" CASCADE;
  DROP TABLE "testimonials" CASCADE;
  DROP TABLE "testimonials_locales" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "posts_locales" CASCADE;
  DROP TABLE "posts_rels" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "redirects" CASCADE;
  DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "homepage_benefits" CASCADE;
  DROP TABLE "homepage_benefits_locales" CASCADE;
  DROP TABLE "homepage" CASCADE;
  DROP TABLE "homepage_locales" CASCADE;
  DROP TABLE "homepage_rels" CASCADE;
  DROP TABLE "branding_socials" CASCADE;
  DROP TABLE "branding" CASCADE;
  DROP TABLE "branding_locales" CASCADE;
  DROP TABLE "contact_settings_show_on" CASCADE;
  DROP TABLE "contact_settings" CASCADE;
  DROP TABLE "contact_settings_locales" CASCADE;
  DROP TABLE "navigation_header_links" CASCADE;
  DROP TABLE "navigation_header_links_locales" CASCADE;
  DROP TABLE "navigation_footer_columns_links" CASCADE;
  DROP TABLE "navigation_footer_columns_links_locales" CASCADE;
  DROP TABLE "navigation_footer_columns" CASCADE;
  DROP TABLE "navigation_footer_columns_locales" CASCADE;
  DROP TABLE "navigation" CASCADE;
  DROP TABLE "navigation_locales" CASCADE;
  DROP TABLE "delivery_settings_zones_districts" CASCADE;
  DROP TABLE "delivery_settings_zones" CASCADE;
  DROP TABLE "delivery_settings_zones_locales" CASCADE;
  DROP TABLE "delivery_settings_methods" CASCADE;
  DROP TABLE "delivery_settings_methods_locales" CASCADE;
  DROP TABLE "delivery_settings" CASCADE;
  DROP TABLE "delivery_settings_locales" CASCADE;
  DROP TABLE "payment_settings" CASCADE;
  DROP TABLE "payment_settings_locales" CASCADE;
  DROP TABLE "analytics_settings" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_products_variants_unit";
  DROP TYPE "public"."enum_products_status";
  DROP TYPE "public"."enum_products_translation_status";
  DROP TYPE "public"."enum_categories_status";
  DROP TYPE "public"."enum_categories_translation_status";
  DROP TYPE "public"."enum_stock_adjustments_reason";
  DROP TYPE "public"."enum_orders_district";
  DROP TYPE "public"."enum_orders_status";
  DROP TYPE "public"."enum_orders_payment_status";
  DROP TYPE "public"."enum_orders_payment_method";
  DROP TYPE "public"."enum_orders_locale";
  DROP TYPE "public"."enum_payments_provider";
  DROP TYPE "public"."enum_payments_status";
  DROP TYPE "public"."enum_customers_last_address_district";
  DROP TYPE "public"."enum_coupons_type";
  DROP TYPE "public"."enum_faqs_topic";
  DROP TYPE "public"."enum_faqs_status";
  DROP TYPE "public"."enum_faqs_translation_status";
  DROP TYPE "public"."enum_testimonials_moderation";
  DROP TYPE "public"."enum_posts_status";
  DROP TYPE "public"."enum_posts_translation_status";
  DROP TYPE "public"."enum_pages_kind";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum_pages_translation_status";
  DROP TYPE "public"."enum_redirects_type";
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_homepage_benefits_icon";
  DROP TYPE "public"."enum_homepage_announcement_tone";
  DROP TYPE "public"."enum_branding_socials_platform";
  DROP TYPE "public"."enum_contact_settings_show_on";
  DROP TYPE "public"."enum_contact_settings_position";
  DROP TYPE "public"."enum_delivery_settings_zones_districts";`)
}
