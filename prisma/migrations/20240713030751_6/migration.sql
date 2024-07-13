/*
  Warnings:

  - You are about to drop the column `pengulangan` on the `budget` table. All the data in the column will be lost.
  - You are about to drop the column `sisaBudget` on the `budget` table. All the data in the column will be lost.
  - You are about to drop the column `tanggalMulai` on the `budget` table. All the data in the column will be lost.
  - You are about to drop the column `tanggalSelesai` on the `budget` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `budget` DROP COLUMN `pengulangan`,
    DROP COLUMN `sisaBudget`,
    DROP COLUMN `tanggalMulai`,
    DROP COLUMN `tanggalSelesai`;

-- CreateTable
CREATE TABLE `detailBudget` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sisaBudget` DOUBLE NULL,
    `terpakai` DOUBLE NULL,
    `tanggalMulai` DATETIME(3) NULL,
    `tanggalSelesai` DATETIME(3) NULL,
    `pengulangan` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `budgetId` INTEGER NULL,

    INDEX `detailBudget_budgetId_idx`(`budgetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `detailBudget` ADD CONSTRAINT `detailBudget_budgetId_fkey` FOREIGN KEY (`budgetId`) REFERENCES `budget`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
