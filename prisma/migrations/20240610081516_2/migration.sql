-- CreateTable
CREATE TABLE `detailRiwayat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `namaBarang` VARCHAR(191) NULL,
    `jumlah` INTEGER NULL,
    `harga` DOUBLE NULL,
    `total` DOUBLE NULL,
    `riwayatId` INTEGER NULL,

    INDEX `detailRiwayat_riwayatId_idx`(`riwayatId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `detailRiwayat` ADD CONSTRAINT `detailRiwayat_riwayatId_fkey` FOREIGN KEY (`riwayatId`) REFERENCES `riwayat`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
