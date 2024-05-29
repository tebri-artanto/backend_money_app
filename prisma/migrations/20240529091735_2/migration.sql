/*
  Warnings:

  - Added the required column `grupId` to the `bulan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `bulan` ADD COLUMN `grupId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `Grup` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `namaGrup` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GrupMember` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `grupId` INTEGER NOT NULL,

    INDEX `GrupMember_userId_idx`(`userId`),
    INDEX `GrupMember_grupId_idx`(`grupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budgetBulanan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bulan` VARCHAR(191) NOT NULL,
    `tahun` VARCHAR(191) NOT NULL,
    `budget` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `grupId` INTEGER NOT NULL,

    INDEX `budgetBulanan_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GrupMember` ADD CONSTRAINT `GrupMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GrupMember` ADD CONSTRAINT `GrupMember_grupId_fkey` FOREIGN KEY (`grupId`) REFERENCES `Grup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budgetBulanan` ADD CONSTRAINT `budgetBulanan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budgetBulanan` ADD CONSTRAINT `budgetBulanan_grupId_fkey` FOREIGN KEY (`grupId`) REFERENCES `Grup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bulan` ADD CONSTRAINT `bulan_grupId_fkey` FOREIGN KEY (`grupId`) REFERENCES `Grup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
