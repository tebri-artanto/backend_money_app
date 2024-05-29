-- DropForeignKey
ALTER TABLE `asaluang` DROP FOREIGN KEY `asalUang_userId_fkey`;

-- DropForeignKey
ALTER TABLE `budgetbulanan` DROP FOREIGN KEY `budgetBulanan_grupId_fkey`;

-- DropForeignKey
ALTER TABLE `budgetbulanan` DROP FOREIGN KEY `budgetBulanan_userId_fkey`;

-- DropForeignKey
ALTER TABLE `bulan` DROP FOREIGN KEY `bulan_grupId_fkey`;

-- DropForeignKey
ALTER TABLE `bulan` DROP FOREIGN KEY `bulan_userId_fkey`;

-- DropForeignKey
ALTER TABLE `kategori` DROP FOREIGN KEY `kategori_userId_fkey`;

-- DropForeignKey
ALTER TABLE `riwayat` DROP FOREIGN KEY `riwayat_asalUangId_fkey`;

-- DropForeignKey
ALTER TABLE `riwayat` DROP FOREIGN KEY `riwayat_bulanId_fkey`;

-- DropForeignKey
ALTER TABLE `riwayat` DROP FOREIGN KEY `riwayat_kategoriId_fkey`;

-- DropForeignKey
ALTER TABLE `riwayat` DROP FOREIGN KEY `riwayat_notaId_fkey`;

-- AlterTable
ALTER TABLE `asaluang` ADD COLUMN `grupId` INTEGER NULL,
    MODIFY `tipeAsalUang` VARCHAR(191) NULL,
    MODIFY `riwayatId` INTEGER NULL,
    MODIFY `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `budgetbulanan` MODIFY `bulan` VARCHAR(191) NULL,
    MODIFY `tahun` VARCHAR(191) NULL,
    MODIFY `budget` DOUBLE NULL,
    MODIFY `userId` INTEGER NULL,
    MODIFY `grupId` INTEGER NULL;

-- AlterTable
ALTER TABLE `bulan` MODIFY `bln` VARCHAR(191) NULL,
    MODIFY `tahun` VARCHAR(191) NULL,
    MODIFY `pemasukan` DOUBLE NULL,
    MODIFY `pengeluaran` DOUBLE NULL,
    MODIFY `total` DOUBLE NULL,
    MODIFY `userId` INTEGER NULL,
    MODIFY `grupId` INTEGER NULL;

-- AlterTable
ALTER TABLE `grup` MODIFY `namaGrup` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `kategori` ADD COLUMN `grupId` INTEGER NULL,
    MODIFY `namaKategori` VARCHAR(191) NULL,
    MODIFY `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `nota` MODIFY `imagePath` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `riwayat` MODIFY `tanggal` DATETIME(3) NULL,
    MODIFY `tipe` VARCHAR(191) NULL,
    MODIFY `nominal` DOUBLE NULL,
    MODIFY `catatan` VARCHAR(191) NULL,
    MODIFY `asalUangId` INTEGER NULL,
    MODIFY `kategoriId` INTEGER NULL,
    MODIFY `notaId` INTEGER NULL,
    MODIFY `bulanId` INTEGER NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `username` VARCHAR(191) NULL,
    MODIFY `email` VARCHAR(191) NULL,
    MODIFY `password` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `budgetBulanan` ADD CONSTRAINT `budgetBulanan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budgetBulanan` ADD CONSTRAINT `budgetBulanan_grupId_fkey` FOREIGN KEY (`grupId`) REFERENCES `Grup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bulan` ADD CONSTRAINT `bulan_grupId_fkey` FOREIGN KEY (`grupId`) REFERENCES `Grup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bulan` ADD CONSTRAINT `bulan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asalUang` ADD CONSTRAINT `asalUang_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asalUang` ADD CONSTRAINT `asalUang_grupId_fkey` FOREIGN KEY (`grupId`) REFERENCES `Grup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kategori` ADD CONSTRAINT `kategori_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kategori` ADD CONSTRAINT `kategori_grupId_fkey` FOREIGN KEY (`grupId`) REFERENCES `Grup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat` ADD CONSTRAINT `riwayat_asalUangId_fkey` FOREIGN KEY (`asalUangId`) REFERENCES `asalUang`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat` ADD CONSTRAINT `riwayat_kategoriId_fkey` FOREIGN KEY (`kategoriId`) REFERENCES `kategori`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat` ADD CONSTRAINT `riwayat_notaId_fkey` FOREIGN KEY (`notaId`) REFERENCES `nota`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat` ADD CONSTRAINT `riwayat_bulanId_fkey` FOREIGN KEY (`bulanId`) REFERENCES `bulan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
