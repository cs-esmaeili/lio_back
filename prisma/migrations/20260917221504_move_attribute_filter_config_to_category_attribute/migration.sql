-- Attribute is now a generic definition only (name, slug, type).
-- Per-category presentation config moves to CategoryAttribute, which already
-- owns is_filterable and usage.
ALTER TABLE "attributes"
  DROP COLUMN "filter_type",
  DROP COLUMN "is_multi_select",
  DROP COLUMN "is_filterable";

ALTER TABLE "category_attributes"
  ADD COLUMN "filter_type" "FilterType" NOT NULL DEFAULT 'CHECKBOX',
  ADD COLUMN "is_multi_select" BOOLEAN NOT NULL DEFAULT true;
