/*
  Warnings:

  - You are about to drop the column `option_id` on the `product_attribute_values` table. All the data in the column will be lost.
  - You are about to drop the `attribute_options` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "FilterType" AS ENUM ('CHECKBOX', 'RADIO', 'SELECT', 'RANGE', 'TOGGLE', 'SEARCH');

-- DropForeignKey
ALTER TABLE "attribute_options" DROP CONSTRAINT "attribute_options_attribute_id_fkey";

-- DropForeignKey
ALTER TABLE "product_attribute_values" DROP CONSTRAINT "product_attribute_values_option_id_fkey";

-- DropIndex
DROP INDEX "product_attribute_values_option_id_idx";

-- AlterTable
ALTER TABLE "attributes" ADD COLUMN     "filter_type" "FilterType" NOT NULL DEFAULT 'CHECKBOX',
ADD COLUMN     "is_filterable" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "is_multi_select" SET DEFAULT true;

-- AlterTable
ALTER TABLE "product_attribute_values" DROP COLUMN "option_id",
ADD COLUMN     "filter_id" INTEGER;

-- DropTable
DROP TABLE "attribute_options";

-- CreateTable
CREATE TABLE "filters" (
    "id" SERIAL NOT NULL,
    "attribute_id" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "slug" TEXT,
    "color" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "filters_attribute_id_value_key" ON "filters"("attribute_id", "value");

-- CreateIndex
CREATE UNIQUE INDEX "filters_attribute_id_slug_key" ON "filters"("attribute_id", "slug");

-- CreateIndex
CREATE INDEX "product_attribute_values_filter_id_idx" ON "product_attribute_values"("filter_id");

-- AddForeignKey
ALTER TABLE "filters" ADD CONSTRAINT "filters_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_filter_id_fkey" FOREIGN KEY ("filter_id") REFERENCES "filters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
