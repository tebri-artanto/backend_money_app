/*
  Warnings:

  - You are about to drop the column `budgetId` on the `riwayat` table. All the data in the column will be lost.
  - You are about to drop the `detailRiwayat` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `detailRiwayat` DROP FOREIGN KEY `detailRiwayat_riwayatId_fkey`;

-- DropForeignKey
ALTER TABLE `riwayat` DROP FOREIGN KEY `riwayat_budgetId_fkey`;

-- AlterTable
ALTER TABLE `riwayat` DROP COLUMN `budgetId`,
    ADD COLUMN `detailBudgetId` INTEGER NULL;

-- DropTable
DROP TABLE `detailRiwayat`;

-- AddForeignKey
ALTER TABLE `riwayat` ADD CONSTRAINT `riwayat_detailBudgetId_fkey` FOREIGN KEY (`detailBudgetId`) REFERENCES `detailBudget`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
