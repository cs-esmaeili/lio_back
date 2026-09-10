-- AlterEnum
ALTER TYPE "PageSectionType" ADD VALUE 'BANNER';

-- CreateTable
CREATE TABLE "banner_sections" (
    "id" SERIAL NOT NULL,
    "section_id" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "button_title" TEXT,
    "button_url" TEXT,
    "desktop_file_id" INTEGER NOT NULL,
    "tablet_file_id" INTEGER NOT NULL,
    "mobile_file_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banner_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "banner_sections_section_id_sort_order_idx" ON "banner_sections"("section_id", "sort_order");

-- AddForeignKey
ALTER TABLE "banner_sections" ADD CONSTRAINT "banner_sections_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "page_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banner_sections" ADD CONSTRAINT "banner_sections_desktop_file_id_fkey" FOREIGN KEY ("desktop_file_id") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banner_sections" ADD CONSTRAINT "banner_sections_tablet_file_id_fkey" FOREIGN KEY ("tablet_file_id") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banner_sections" ADD CONSTRAINT "banner_sections_mobile_file_id_fkey" FOREIGN KEY ("mobile_file_id") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
