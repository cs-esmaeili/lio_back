-- CreateEnum
CREATE TYPE "FooterSectionType" AS ENUM ('LINK', 'CATEGORY');

-- AlterEnum
ALTER TYPE "PageSectionLocation" ADD VALUE 'FOOTER';

-- AlterEnum
ALTER TYPE "PageSectionType" ADD VALUE 'FOOTER';

-- CreateTable
CREATE TABLE "footer_sections" (
    "id" SERIAL NOT NULL,
    "section_id" INTEGER NOT NULL,
    "type" "FooterSectionType" NOT NULL,
    "label" TEXT,
    "url" TEXT,
    "description" TEXT,
    "file_id" INTEGER,
    "category_id" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "footer_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "footer_sections_section_id_sort_order_idx" ON "footer_sections"("section_id", "sort_order");

-- AddForeignKey
ALTER TABLE "footer_sections" ADD CONSTRAINT "footer_sections_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "page_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "footer_sections" ADD CONSTRAINT "footer_sections_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "footer_sections" ADD CONSTRAINT "footer_sections_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
