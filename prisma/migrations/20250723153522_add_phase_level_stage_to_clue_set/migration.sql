-- AlterTable
ALTER TABLE `clue_sets` ADD COLUMN `levelNumber` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `phase` ENUM('PHASE_1', 'PHASE_2', 'PHASE_3', 'PHASE_4') NOT NULL DEFAULT 'PHASE_1',
    ADD COLUMN `stageNumber` INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX `clue_sets_gameId_phase_levelNumber_stageNumber_idx` ON `clue_sets`(`gameId`, `phase`, `levelNumber`, `stageNumber`);
