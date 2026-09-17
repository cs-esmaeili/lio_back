-- AttributeOption separates the stable machine value from the display title.
ALTER TABLE "attribute_options" ADD COLUMN "title" TEXT NOT NULL DEFAULT '';

ALTER TABLE "attribute_options" ALTER COLUMN "title" DROP DEFAULT;
