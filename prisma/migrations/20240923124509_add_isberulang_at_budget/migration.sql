/*
  Warnings:

  - You are about to drop the column `grupId` on the `asalUang` table. All the data in the column will be lost.
  - You are about to drop the column `grupId` on the `budget` table. All the data in the column will be lost.
  - You are about to drop the column `grupId` on the `bulan` table. All the data in the column will be lost.
  - You are about to drop the column `grupId` on the `kategori` table. All the data in the column will be lost.
  - You are about to drop the `Grup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GrupMember` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Grup` DROP FOREIGN KEY `Grup_userCreateId_fkey`;

-- DropForeignKey
ALTER TABLE `GrupMember` DROP FOREIGN KEY `GrupMember_grupId_fkey`;

-- DropForeignKey
ALTER TABLE `GrupMember` DROP FOREIGN KEY `GrupMember_userId_fkey`;

-- DropForeignKey
ALTER TABLE `asalUang` DROP FOREIGN KEY `asalUang_grupId_fkey`;

-- DropForeignKey
ALTER TABLE `budget` DROP FOREIGN KEY `budget_grupId_fkey`;

-- DropForeignKey
ALTER TABLE `bulan` DROP FOREIGN KEY `bulan_grupId_fkey`;

-- DropForeignKey
ALTER TABLE `kategori` DROP FOREIGN KEY `kategori_grupId_fkey`;

-- AlterTable
ALTER TABLE `asalUang` DROP COLUMN `grupId`;

-- AlterTable
ALTER TABLE `budget` DROP COLUMN `grupId`,
    ADD COLUMN `isBerulang` BOOLEAN NULL;

-- AlterTable
ALTER TABLE `bulan` DROP COLUMN `grupId`;

-- AlterTable
ALTER TABLE `kategori` DROP COLUMN `grupId`;

-- DropTable
DROP TABLE `Grup`;

-- DropTable
DROP TABLE `GrupMember`;
