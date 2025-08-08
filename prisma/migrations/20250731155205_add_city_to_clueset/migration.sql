-- AlterTable
ALTER TABLE `clue_sets` ADD COLUMN `city` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `clue_sets_city_idx` ON `clue_sets`(`city`);
