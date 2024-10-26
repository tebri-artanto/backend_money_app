/*
  Warnings:

  - You are about to drop the `Prediction` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `bulan` ADD COLUMN `tabungan` DOUBLE NULL;

-- DropTable
DROP TABLE `Prediction`;
