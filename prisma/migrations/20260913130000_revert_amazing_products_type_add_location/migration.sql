-- CreateEnum
CREATE TYPE "PageSectionLocation" AS ENUM ('SLIDER', 'PRODUCT_LIST', 'AMAZING_PRODUCTS', 'BANNER', 'INTRODUCTION');

-- AlterTable
ALTER TABLE "page_sections" ADD COLUMN "location" "PageSectionLocation";

-- Backfill: sections mirror their type, except amazing product lists which keep their own location
UPDATE "page_sections"
SET "location" = CASE
  WHEN "type"::text = 'AMAZING_PRODUCTS' THEN 'AMAZING_PRODUCTS'::"PageSectionLocation"
  ELSE "type"::text::"PageSectionLocation"
END;

-- Normalize the type now that AMAZING_PRODUCTS moved to location
UPDATE "page_sections" SET "type" = 'PRODUCT_LIST' WHERE "type"::text = 'AMAZING_PRODUCTS';

-- AlterTable
ALTER TABLE "page_sections" ALTER COLUMN "location" SET NOT NULL;

-- AlterEnum
BEGIN;
CREATE TYPE "PageSectionType_new" AS ENUM ('SLIDER', 'PRODUCT_LIST', 'BANNER', 'INTRODUCTION');
ALTER TABLE "page_sections" ALTER COLUMN "type" TYPE "PageSectionType_new" USING ("type"::text::"PageSectionType_new");
ALTER TYPE "PageSectionType" RENAME TO "PageSectionType_old";
ALTER TYPE "PageSectionType_new" RENAME TO "PageSectionType";
DROP TYPE "PageSectionType_old";
COMMIT;
