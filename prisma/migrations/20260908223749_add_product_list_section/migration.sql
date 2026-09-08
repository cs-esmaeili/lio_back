-- AlterEnum
ALTER TYPE "PageSectionType" ADD VALUE 'PRODUCT_LIST';

-- CreateTable
CREATE TABLE "product_list_sections" (
    "id" SERIAL NOT NULL,
    "section_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_list_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_list_sections_section_id_sort_order_idx" ON "product_list_sections"("section_id", "sort_order");

-- AddForeignKey
ALTER TABLE "product_list_sections" ADD CONSTRAINT "product_list_sections_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "page_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_list_sections" ADD CONSTRAINT "product_list_sections_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
