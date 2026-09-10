-- AlterEnum
ALTER TYPE "PageSectionType" ADD VALUE 'INTRODUCTION';

-- CreateTable
CREATE TABLE "introduction_sections" (
    "id" SERIAL NOT NULL,
    "section_id" INTEGER NOT NULL,
    "titles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "desktop_file_id" INTEGER NOT NULL,
    "tablet_file_id" INTEGER,
    "mobile_file_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "introduction_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "introduction_sections_section_id_key" ON "introduction_sections"("section_id");

-- AddForeignKey
ALTER TABLE "introduction_sections" ADD CONSTRAINT "introduction_sections_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "page_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "introduction_sections" ADD CONSTRAINT "introduction_sections_desktop_file_id_fkey" FOREIGN KEY ("desktop_file_id") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "introduction_sections" ADD CONSTRAINT "introduction_sections_tablet_file_id_fkey" FOREIGN KEY ("tablet_file_id") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "introduction_sections" ADD CONSTRAINT "introduction_sections_mobile_file_id_fkey" FOREIGN KEY ("mobile_file_id") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
