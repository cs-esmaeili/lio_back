-- CreateEnum
CREATE TYPE "HeaderSectionType" AS ENUM ('LINK', 'CATEGORY');

-- AlterEnum
ALTER TYPE "PageSectionLocation" ADD VALUE 'HEADER';

-- AlterEnum
ALTER TYPE "PageSectionType" ADD VALUE 'HEADER';

-- CreateTable
CREATE TABLE "header_sections" (
    "id" SERIAL NOT NULL,
    "section_id" INTEGER NOT NULL,
    "type" "HeaderSectionType" NOT NULL,
    "label" TEXT,
    "url" TEXT,
    "category_id" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "header_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "header_sections_section_id_sort_order_idx" ON "header_sections"("section_id", "sort_order");

-- AddForeignKey
ALTER TABLE "header_sections" ADD CONSTRAINT "header_sections_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "page_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "header_sections" ADD CONSTRAINT "header_sections_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
