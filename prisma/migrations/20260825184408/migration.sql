-- CreateEnum
CREATE TYPE "entityType" AS ENUM ('PRODUCT', 'CATEGORY', 'POST', 'BRAND', 'PAGE');

-- CreateTable
CREATE TABLE "Page" (
    "id" SERIAL NOT NULL,
    "entityType" "entityType" NOT NULL,
    "entityId" INTEGER,
    "slug" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "canonicalUrl" TEXT,
    "robotsIndex" BOOLEAN NOT NULL DEFAULT true,
    "robotsFollow" BOOLEAN NOT NULL DEFAULT true,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Page_entityType_entityId_key" ON "Page"("entityType", "entityId");
