/*
  Warnings:

  - You are about to drop the column `bulanId` on the `budget` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `budget` DROP FOREIGN KEY `budget_bulanId_fkey`;

-- AlterTable
ALTER TABLE `budget` DROP COLUMN `bulanId`;

-- AlterTable
ALTER TABLE `riwayat` ADD COLUMN `budgetId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `riwayat` ADD CONSTRAINT `riwayat_budgetId_fkey` FOREIGN KEY (`budgetId`) REFERENCES `budget`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
