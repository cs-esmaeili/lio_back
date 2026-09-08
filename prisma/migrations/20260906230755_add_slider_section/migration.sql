-- CreateEnum
CREATE TYPE "PageSectionType" AS ENUM ('SLIDER');

-- CreateEnum
CREATE TYPE "PageSectionStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "page_sections" ALTER COLUMN "type" SET DATA TYPE "PageSectionType" USING (upper("type")::"PageSectionType");

-- DropIndex
DROP INDEX "page_sections_page_id_is_active_sort_order_idx";

-- AlterTable
ALTER TABLE "page_sections" DROP COLUMN "title";

-- AlterTable
ALTER TABLE "page_sections" DROP COLUMN "data";

-- AlterTable
ALTER TABLE "page_sections" DROP COLUMN "is_active";

-- AlterTable
ALTER TABLE "page_sections" ADD COLUMN "status" "PageSectionStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "page_sections_page_id_status_sort_order_idx" ON "page_sections"("page_id", "status", "sort_order");

-- CreateTable
CREATE TABLE "slider_sections" (
    "id" SERIAL NOT NULL,
    "section_id" INTEGER NOT NULL,
    "desktop_file_id" INTEGER,
    "tablet_file_id" INTEGER,
    "mobile_file_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slider_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "slider_sections_section_id_key" ON "slider_sections"("section_id");

-- AddForeignKey
ALTER TABLE "slider_sections" ADD CONSTRAINT "slider_sections_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "page_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slider_sections" ADD CONSTRAINT "slider_sections_desktop_file_id_fkey" FOREIGN KEY ("desktop_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slider_sections" ADD CONSTRAINT "slider_sections_tablet_file_id_fkey" FOREIGN KEY ("tablet_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slider_sections" ADD CONSTRAINT "slider_sections_mobile_file_id_fkey" FOREIGN KEY ("mobile_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DataMigration: create a slider row for existing SLIDER sections
INSERT INTO "slider_sections" ("section_id", "created_at", "updated_at")
SELECT "id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "page_sections" WHERE "type" = 'SLIDER';
