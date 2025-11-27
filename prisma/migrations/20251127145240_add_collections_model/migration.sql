/*
  Warnings:

  - You are about to drop the column `categoryId` on the `products` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_categoryId_fkey";

-- DropIndex
DROP INDEX "products_categoryId_idx";

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "collections_slug_key" ON "collections"("slug");

-- CreateIndex
CREATE INDEX "collections_categoryId_idx" ON "collections"("categoryId");

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data Migration: Create default collection for each category
INSERT INTO "collections" ("id", "name", "description", "slug", "categoryId", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    c.name || ' Collection',
    'Default collection for ' || c.name,
    c.slug || '-collection',
    c.id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "categories" c;

-- Add collectionId column to products BEFORE dropping categoryId
ALTER TABLE "products" ADD COLUMN "collectionId" TEXT;

-- Data Migration: Update products to link to their category's default collection
UPDATE "products" p
SET "collectionId" = (
    SELECT col.id 
    FROM "collections" col 
    WHERE col."categoryId" = p."categoryId"
    LIMIT 1
)
WHERE p."categoryId" IS NOT NULL;

-- Now drop the categoryId column
ALTER TABLE "products" DROP COLUMN "categoryId";

-- CreateIndex
CREATE INDEX "products_collectionId_idx" ON "products"("collectionId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
