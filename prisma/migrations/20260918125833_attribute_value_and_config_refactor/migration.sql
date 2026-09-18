-- Per-attribute display/variant config moves from category_attributes to attributes.
ALTER TABLE "category_attributes" DROP COLUMN "usage";
ALTER TABLE "category_attributes" DROP COLUMN "filter_type";
ALTER TABLE "category_attributes" DROP COLUMN "is_multi_select";

ALTER TABLE "attributes" ADD COLUMN "usage" "AttributeUsage" NOT NULL DEFAULT 'SPEC';
ALTER TABLE "attributes" ADD COLUMN "filter_type" "FilterType" NOT NULL DEFAULT 'CHECKBOX';
ALTER TABLE "attributes" ADD COLUMN "is_multi_select" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "attributes" DROP COLUMN "type";
DROP TYPE "AttributeType";

-- The option catalog becomes attribute_values; value is the only text column.
ALTER TABLE "attribute_options" DROP COLUMN "color";
ALTER TABLE "attribute_options" DROP COLUMN "title";
ALTER TABLE "attribute_options" RENAME TO "attribute_values";
ALTER TABLE "attribute_values" RENAME CONSTRAINT "attribute_options_pkey" TO "attribute_values_pkey";
ALTER TABLE "attribute_values" RENAME CONSTRAINT "attribute_options_attribute_id_fkey" TO "attribute_values_attribute_id_fkey";
ALTER INDEX "attribute_options_attribute_id_value_key" RENAME TO "attribute_values_attribute_id_value_key";
ALTER SEQUENCE "filters_id_seq" RENAME TO "attribute_values_id_seq";

-- Product values reference an option by id.
DROP INDEX "product_attribute_values_product_id_attribute_id_value_key";
ALTER TABLE "product_attribute_values" DROP COLUMN "value";
ALTER TABLE "product_attribute_values" ADD COLUMN "attribute_value_id" INTEGER NOT NULL;
CREATE INDEX "product_attribute_values_attribute_value_id_idx" ON "product_attribute_values"("attribute_value_id");
CREATE UNIQUE INDEX "product_attribute_values_product_id_attribute_id_value_id_key" ON "product_attribute_values"("product_id", "attribute_id", "attribute_value_id");
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_attribute_value_id_fkey" FOREIGN KEY ("attribute_value_id") REFERENCES "attribute_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;
