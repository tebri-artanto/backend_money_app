/*
  Warnings:

  - You are about to drop the column `riwayatId` on the `asaluang` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `asalUang_riwayatId_key` ON `asaluang`;

-- AlterTable
ALTER TABLE `asaluang` DROP COLUMN `riwayatId`;
