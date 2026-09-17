-- Route identity moves onto the entities that own it.
-- Categories gain a unique slug (backfilled for any pre-existing rows).
ALTER TABLE "categories" ADD COLUMN "slug" TEXT;

UPDATE "categories" SET "slug" = 'category-' || "id" WHERE "slug" IS NULL;

ALTER TABLE "categories" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- Tags gain a unique slug (same rationale).
ALTER TABLE "tags" ADD COLUMN "slug" TEXT;

UPDATE "tags" SET "slug" = 'tag-' || "id" WHERE "slug" IS NULL;

ALTER TABLE "tags" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- Page is now SEO-only: its slug is optional and only used by standalone pages.
-- Entity-bound pages (PRODUCT/CATEGORY/TAG/BRAND) take their slug from the entity.
ALTER TABLE "pages" ALTER COLUMN "slug" DROP NOT NULL;
