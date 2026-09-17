-- The "filters" table was really the option catalog of an attribute, so rename it
-- to attribute_options. The label column was removed in favor of value.
ALTER TABLE "filters" RENAME TO "attribute_options";

ALTER TABLE "attribute_options" RENAME CONSTRAINT "filters_pkey" TO "attribute_options_pkey";

ALTER TABLE "attribute_options" RENAME CONSTRAINT "filters_attribute_id_fkey" TO "attribute_options_attribute_id_fkey";

ALTER INDEX "filters_attribute_id_value_key" RENAME TO "attribute_options_attribute_id_value_key";

ALTER TABLE "attribute_options" DROP COLUMN "label";
