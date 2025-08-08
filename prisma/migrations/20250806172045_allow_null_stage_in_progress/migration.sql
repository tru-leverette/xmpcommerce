/*
  Warnings:

  - You are about to drop the column `pebbles` on the `participants` table. All the data in the column will be lost.
  - You are about to drop the column `requiredPebbles` on the `stages` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[progressId]` on the table `participants` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `participant_progress` DROP FOREIGN KEY `participant_progress_stageId_fkey`;

-- AlterTable
ALTER TABLE `clues` MODIFY `question` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `participant_progress` MODIFY `stageId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `participants` DROP COLUMN `pebbles`,
    ADD COLUMN `progressId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `stages` DROP COLUMN `requiredPebbles`;

-- CreateIndex
CREATE UNIQUE INDEX `participants_progressId_key` ON `participants`(`progressId`);

-- AddForeignKey
ALTER TABLE `participants` ADD CONSTRAINT `participants_progressId_fkey` FOREIGN KEY (`progressId`) REFERENCES `participant_progress`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participant_progress` ADD CONSTRAINT `participant_progress_stageId_fkey` FOREIGN KEY (`stageId`) REFERENCES `stages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
