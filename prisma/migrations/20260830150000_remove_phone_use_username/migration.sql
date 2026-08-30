-- `username` is the phone number (login identifier); backfill it from `phone`.
UPDATE "User" SET "username" = "phone";

-- Drop the redundant phone column (its unique index is dropped with it).
ALTER TABLE "User" DROP COLUMN "phone";

-- username becomes required.
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
