-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN "is_default" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: flag the first variant (by position, then id) of every product as its default
UPDATE "product_variants" AS v
SET "is_default" = true
FROM (
  SELECT DISTINCT ON ("product_id") "id"
  FROM "product_variants"
  ORDER BY "product_id", "position", "id"
) AS first_variant
WHERE v."id" = first_variant."id";
