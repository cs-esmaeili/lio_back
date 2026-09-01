/*
  Warnings:

  - You are about to drop the column `slug` on the `Attribute` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Attribute_slug_key";

-- AlterTable
ALTER TABLE "Attribute" DROP COLUMN "slug";
