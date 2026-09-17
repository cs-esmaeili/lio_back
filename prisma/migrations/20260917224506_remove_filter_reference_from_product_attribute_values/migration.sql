-- Filter is the per-attribute option catalog; category filters are read from it
-- through CategoryAttribute. ProductAttributeValue.value is the single source of
-- truth for a product's value, so the optional Filter link is redundant.
ALTER TABLE "product_attribute_values" DROP CONSTRAINT "product_attribute_values_filter_id_fkey";

DROP INDEX "product_attribute_values_filter_id_idx";

ALTER TABLE "product_attribute_values" DROP COLUMN "filter_id";
