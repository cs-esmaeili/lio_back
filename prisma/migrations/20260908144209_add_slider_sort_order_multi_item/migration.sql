-- DropIndex
DROP INDEX "slider_sections_section_id_key";

-- AlterTable
ALTER TABLE "slider_sections" ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "slider_sections_section_id_sort_order_idx" ON "slider_sections"("section_id", "sort_order");
