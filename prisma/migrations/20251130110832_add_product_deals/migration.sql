-- AlterTable
ALTER TABLE "products" ADD COLUMN     "dealEndDate" TIMESTAMP(3),
ADD COLUMN     "dealStartDate" TIMESTAMP(3),
ADD COLUMN     "isOnDeal" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "products_isOnDeal_idx" ON "products"("isOnDeal");
