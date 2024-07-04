-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `password` VARCHAR(191) NULL,
    `createDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_idx`(`email`),
    INDEX `User_username_idx`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Grup` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `namaGrup` VARCHAR(191) NULL,
    `grupCode` VARCHAR(191) NULL,
    `userCreateId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GrupMember` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dateJoin` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `grupId` INTEGER NOT NULL,

    INDEX `GrupMember_userId_idx`(`userId`),
    INDEX `GrupMember_grupId_idx`(`grupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budget` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `frekuensi` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `kategoriId` INTEGER NULL,
    `bulanId` INTEGER NULL,
    `userId` INTEGER NULL,
    `grupId` INTEGER NULL,

    INDEX `budget_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budgetMingguan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jumlahBudget` DOUBLE NULL,
    `sisaBudget` DOUBLE NULL,
    `hariPengulangan` VARCHAR(191) NULL,
    `tanggalMulai` DATETIME(3) NULL,
    `tanggalSelesai` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budgetBulanan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jumlahBudget` DOUBLE NULL,
    `sisaBudget` DOUBLE NULL,
    `tanggalPenguangan` VARCHAR(191) NULL,
    `tanggalMulai` DATETIME(3) NULL,
    `tanggalSelesai` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bulan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bln` VARCHAR(191) NULL,
    `tahun` VARCHAR(191) NULL,
    `pemasukan` DOUBLE NULL,
    `pengeluaran` DOUBLE NULL,
    `total` DOUBLE NULL,
    `grupId` INTEGER NULL,
    `userId` INTEGER NULL,

    INDEX `bulan_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asalUang` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipeAsalUang` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NULL,
    `grupId` INTEGER NULL,

    INDEX `asalUang_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kategori` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `namaKategori` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NULL,
    `grupId` INTEGER NULL,

    INDEX `kategori_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nota` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imagePath` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `riwayat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tanggal` DATETIME(3) NULL,
    `tipe` VARCHAR(191) NULL,
    `nominal` DOUBLE NULL,
    `catatan` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `asalUangId` INTEGER NULL,
    `kategoriId` INTEGER NULL,
    `notaId` INTEGER NULL,
    `bulanId` INTEGER NULL,

    INDEX `riwayat_bulanId_idx`(`bulanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
ALTER TABLE `Grup` ADD CONSTRAINT `Grup_userCreateId_fkey` FOREIGN KEY (`userCreateId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GrupMember` ADD CONSTRAINT `GrupMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GrupMember` ADD CONSTRAINT `GrupMember_grupId_fkey` FOREIGN KEY (`grupId`) REFERENCES `Grup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget` ADD CONSTRAINT `budget_kategoriId_fkey` FOREIGN KEY (`kategoriId`) REFERENCES `kategori`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget` ADD CONSTRAINT `budget_bulanId_fkey` FOREIGN KEY (`bulanId`) REFERENCES `bulan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget` ADD CONSTRAINT `budget_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget` ADD CONSTRAINT `budget_grupId_fkey` FOREIGN KEY (`grupId`) REFERENCES `Grup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE `detailRiwayat` ADD CONSTRAINT `detailRiwayat_riwayatId_fkey` FOREIGN KEY (`riwayatId`) REFERENCES `riwayat`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
