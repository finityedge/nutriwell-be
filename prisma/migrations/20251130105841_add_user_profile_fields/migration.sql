-- AlterTable
ALTER TABLE "users" ADD COLUMN     "country" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "language" TEXT DEFAULT 'en',
ADD COLUMN     "timezone" TEXT;
