-- AlterTable
ALTER TABLE `games` ADD COLUMN `phase` ENUM('PHASE_1', 'PHASE_2', 'PHASE_3', 'PHASE_4') NOT NULL DEFAULT 'PHASE_1';

-- AlterTable
ALTER TABLE `participant_progress` ADD COLUMN `phase` ENUM('PHASE_1', 'PHASE_2', 'PHASE_3', 'PHASE_4') NOT NULL DEFAULT 'PHASE_1';
