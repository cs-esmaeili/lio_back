/*
  Warnings:

  - The `titles` column on the `introduction_sections` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "introduction_sections" DROP COLUMN "titles",
ADD COLUMN     "titles" JSONB NOT NULL DEFAULT '{}';
