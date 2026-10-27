import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Database-level guarantees beneath the application checks:
 * stock and money can never be negative, and order quantities are positive.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products_variants" ADD CONSTRAINT "products_variants_stock_nonneg" CHECK ("stock" IS NULL OR "stock" >= 0);
    ALTER TABLE "products_variants" ADD CONSTRAINT "products_variants_price_nonneg" CHECK ("price" >= 0 AND ("sale_price" IS NULL OR "sale_price" >= 0));
    ALTER TABLE "orders" ADD CONSTRAINT "orders_amounts_nonneg" CHECK ("subtotal" >= 0 AND "total" >= 0 AND COALESCE("discount", 0) >= 0 AND COALESCE("shipping_fee", 0) >= 0);
    ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_qty_pos" CHECK ("quantity" > 0 AND "unit_price" >= 0 AND "line_total" >= 0);
    ALTER TABLE "coupons" ADD CONSTRAINT "coupons_used_nonneg" CHECK (COALESCE("used_count", 0) >= 0);
    CREATE INDEX IF NOT EXISTS "orders_created_at_status_idx" ON "orders" ("created_at", "status");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products_variants" DROP CONSTRAINT IF EXISTS "products_variants_stock_nonneg";
    ALTER TABLE "products_variants" DROP CONSTRAINT IF EXISTS "products_variants_price_nonneg";
    ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_amounts_nonneg";
    ALTER TABLE "orders_items" DROP CONSTRAINT IF EXISTS "orders_items_qty_pos";
    ALTER TABLE "coupons" DROP CONSTRAINT IF EXISTS "coupons_used_nonneg";
    DROP INDEX IF EXISTS "orders_created_at_status_idx";
  `)
}
