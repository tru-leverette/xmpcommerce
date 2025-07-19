/*
  Warnings:

  - You are about to drop the column `clueSetId` on the `hunts` table. All the data in the column will be lost.
  - You are about to drop the column `clueSetId` on the `participants` table. All the data in the column will be lost.
  - You are about to drop the `clue_sets` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `clue_sets` DROP FOREIGN KEY `clue_sets_gameId_fkey`;

-- DropForeignKey
ALTER TABLE `hunts` DROP FOREIGN KEY `hunts_clueSetId_fkey`;

-- DropForeignKey
ALTER TABLE `participants` DROP FOREIGN KEY `participants_clueSetId_fkey`;

-- DropIndex
DROP INDEX `hunts_clueSetId_idx` ON `hunts`;

-- DropIndex
DROP INDEX `participants_clueSetId_idx` ON `participants`;

-- AlterTable
ALTER TABLE `hunts` DROP COLUMN `clueSetId`;

-- AlterTable
ALTER TABLE `participants` DROP COLUMN `clueSetId`;

-- DropTable
DROP TABLE `clue_sets`;
