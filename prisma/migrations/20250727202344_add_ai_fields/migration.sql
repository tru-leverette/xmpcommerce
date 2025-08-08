/*
  Warnings:

  - You are about to drop the column `aiContext` on the `clues` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `clue_sets` ADD COLUMN `mainSubject` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `clues` DROP COLUMN `aiContext`,
    ADD COLUMN `answerVariations` JSON NULL,
    ADD COLUMN `explanation` VARCHAR(191) NULL;
