/*
  Warnings:

  - You are about to drop the `budgetBulanan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `budgetMingguan` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `budget` ADD COLUMN `jumlahBudget` DOUBLE NULL,
    ADD COLUMN `pengulangan` VARCHAR(191) NULL,
    ADD COLUMN `sisaBudget` DOUBLE NULL,
    ADD COLUMN `tanggalMulai` DATETIME(3) NULL,
    ADD COLUMN `tanggalSelesai` DATETIME(3) NULL;

-- DropTable
DROP TABLE `budgetBulanan`;

-- DropTable
DROP TABLE `budgetMingguan`;
