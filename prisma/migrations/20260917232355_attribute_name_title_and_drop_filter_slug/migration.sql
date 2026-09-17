-- Attribute.name becomes the public machine key (e.g. "color") and title holds the
-- display name (e.g. "رنگ"). The old values are swapped: name (display) -> title,
-- slug (machine) -> name.
ALTER TABLE "attributes" ADD COLUMN "title" TEXT;

UPDATE "attributes" SET "title" = "name", "name" = "slug";

ALTER TABLE "attributes" ALTER COLUMN "title" SET NOT NULL;

DROP INDEX IF EXISTS "attributes_name_idx";

CREATE UNIQUE INDEX "attributes_name_key" ON "attributes"("name");

-- Dropping the column also drops the attributes_slug_key unique index.
ALTER TABLE "attributes" DROP COLUMN "slug";

-- Filter options are addressed by value; the extra slug is unnecessary.
DROP INDEX IF EXISTS "filters_attribute_id_slug_key";

ALTER TABLE "filters" DROP COLUMN "slug";
