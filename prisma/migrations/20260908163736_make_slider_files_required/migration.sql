/*
  Warnings:

  - Made the column `desktop_file_id` on table `slider_sections` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tablet_file_id` on table `slider_sections` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mobile_file_id` on table `slider_sections` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "slider_sections" DROP CONSTRAINT "slider_sections_desktop_file_id_fkey";

-- DropForeignKey
ALTER TABLE "slider_sections" DROP CONSTRAINT "slider_sections_mobile_file_id_fkey";

-- DropForeignKey
ALTER TABLE "slider_sections" DROP CONSTRAINT "slider_sections_tablet_file_id_fkey";

-- AlterTable
ALTER TABLE "slider_sections" ALTER COLUMN "desktop_file_id" SET NOT NULL,
ALTER COLUMN "tablet_file_id" SET NOT NULL,
ALTER COLUMN "mobile_file_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "slider_sections" ADD CONSTRAINT "slider_sections_desktop_file_id_fkey" FOREIGN KEY ("desktop_file_id") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slider_sections" ADD CONSTRAINT "slider_sections_tablet_file_id_fkey" FOREIGN KEY ("tablet_file_id") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slider_sections" ADD CONSTRAINT "slider_sections_mobile_file_id_fkey" FOREIGN KEY ("mobile_file_id") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
