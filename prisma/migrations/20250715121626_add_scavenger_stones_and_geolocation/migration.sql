/*
  Warnings:

  - You are about to drop the column `isCompleted` on the `participant_progress` table. All the data in the column will be lost.
  - Added the required column `badgeType` to the `badges` table without a default value. This is not possible if the table is not empty.
  - Added the required column `levelNumber` to the `badges` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `badges` ADD COLUMN `badgeType` ENUM('STAGE', 'LEVEL') NOT NULL,
    ADD COLUMN `isAvailable` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `levelNumber` INTEGER NOT NULL,
    ADD COLUMN `mergedAt` DATETIME(3) NULL,
    ADD COLUMN `stageNumber` INTEGER NULL;

-- AlterTable
ALTER TABLE `clues` ADD COLUMN `aiContext` JSON NULL,
    ADD COLUMN `aiGenerated` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `locationRadius` DOUBLE NULL,
    ADD COLUMN `requiredLatitude` DOUBLE NULL,
    ADD COLUMN `requiredLongitude` DOUBLE NULL;

-- AlterTable
ALTER TABLE `games` ADD COLUMN `cluesPerStage` INTEGER NOT NULL DEFAULT 4,
    ADD COLUMN `maxLatitude` DOUBLE NULL,
    ADD COLUMN `maxLongitude` DOUBLE NULL,
    ADD COLUMN `minLatitude` DOUBLE NULL,
    ADD COLUMN `minLongitude` DOUBLE NULL,
    ADD COLUMN `region` VARCHAR(191) NULL,
    ADD COLUMN `stagesPerLevel` INTEGER NOT NULL DEFAULT 4,
    ADD COLUMN `totalLevels` INTEGER NOT NULL DEFAULT 12;

-- AlterTable
ALTER TABLE `participant_progress` DROP COLUMN `isCompleted`,
    ADD COLUMN `canAdvanceToNextLevel` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `canAdvanceToNextStage` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isLevelCompleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isStageCompleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lastLocationValid` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `stagesCompletedInLevel` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `participants` ADD COLUMN `currentLatitude` DOUBLE NULL,
    ADD COLUMN `currentLongitude` DOUBLE NULL,
    ADD COLUMN `lastLocationUpdate` DATETIME(3) NULL,
    ADD COLUMN `scavengerStones` INTEGER NOT NULL DEFAULT 0,
    MODIFY `pebbles` INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE `stages` ADD COLUMN `badgeDescription` VARCHAR(191) NULL,
    ADD COLUMN `badgeName` VARCHAR(191) NULL,
    ADD COLUMN `requiredStones` INTEGER NOT NULL DEFAULT 0;
