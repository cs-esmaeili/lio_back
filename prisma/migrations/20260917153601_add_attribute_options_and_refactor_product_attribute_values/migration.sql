/*
  Warnings:

  - You are about to drop the column `category_attribute_id` on the `product_attribute_values` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `attributes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[product_id,attribute_id,value]` on the table `product_attribute_values` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `attributes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `attribute_id` to the `product_attribute_values` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AttributeUsage" AS ENUM ('SPEC', 'VARIANT');

-- DropForeignKey
ALTER TABLE "product_attribute_values" DROP CONSTRAINT "product_attribute_values_category_attribute_id_fkey";

-- DropIndex
DROP INDEX "product_attribute_values_category_attribute_id_idx";

-- DropIndex
DROP INDEX "product_attribute_values_product_id_category_attribute_id_key";

-- AlterTable
ALTER TABLE "attributes" ADD COLUMN     "is_multi_select" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "category_attributes" ADD COLUMN     "usage" "AttributeUsage" NOT NULL DEFAULT 'SPEC';

-- AlterTable
ALTER TABLE "product_attribute_values" DROP COLUMN "category_attribute_id",
ADD COLUMN     "attribute_id" INTEGER NOT NULL,
ADD COLUMN     "option_id" INTEGER;

-- CreateTable
CREATE TABLE "attribute_options" (
    "id" SERIAL NOT NULL,
    "attribute_id" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attribute_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attribute_options_attribute_id_value_key" ON "attribute_options"("attribute_id", "value");

-- CreateIndex
CREATE UNIQUE INDEX "attributes_slug_key" ON "attributes"("slug");

-- CreateIndex
CREATE INDEX "product_attribute_values_attribute_id_idx" ON "product_attribute_values"("attribute_id");

-- CreateIndex
CREATE INDEX "product_attribute_values_option_id_idx" ON "product_attribute_values"("option_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_attribute_values_product_id_attribute_id_value_key" ON "product_attribute_values"("product_id", "attribute_id", "value");

-- AddForeignKey
ALTER TABLE "attribute_options" ADD CONSTRAINT "attribute_options_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "attribute_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;
