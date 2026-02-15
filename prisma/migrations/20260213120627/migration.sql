/*
  Warnings:

  - You are about to drop the column `experince` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "experince",
ADD COLUMN     "credits" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "experience" INTEGER,
ADD COLUMN     "tier" TEXT NOT NULL DEFAULT 'Free';
