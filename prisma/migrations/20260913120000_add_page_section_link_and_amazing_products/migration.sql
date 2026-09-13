-- AlterEnum
ALTER TYPE "PageSectionType" ADD VALUE 'AMAZING_PRODUCTS';

-- AlterTable
ALTER TABLE "page_sections" ADD COLUMN "link" TEXT;
