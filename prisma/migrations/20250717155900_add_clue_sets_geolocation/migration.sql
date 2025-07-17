-- AlterTable
ALTER TABLE `hunts` ADD COLUMN `clueSetId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `participants` ADD COLUMN `clueSetId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `clue_sets` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `centerLatitude` DOUBLE NOT NULL,
    `centerLongitude` DOUBLE NOT NULL,
    `radiusKm` DOUBLE NOT NULL DEFAULT 16.09344,
    `minLatitude` DOUBLE NOT NULL,
    `maxLatitude` DOUBLE NOT NULL,
    `minLongitude` DOUBLE NOT NULL,
    `maxLongitude` DOUBLE NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `gameId` VARCHAR(191) NOT NULL,

    INDEX `clue_sets_gameId_idx`(`gameId`),
    INDEX `clue_sets_centerLatitude_centerLongitude_idx`(`centerLatitude`, `centerLongitude`),
    INDEX `clue_sets_minLatitude_maxLatitude_minLongitude_maxLongitude_idx`(`minLatitude`, `maxLatitude`, `minLongitude`, `maxLongitude`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `hunts_clueSetId_idx` ON `hunts`(`clueSetId`);

-- CreateIndex
CREATE INDEX `participants_clueSetId_idx` ON `participants`(`clueSetId`);

-- AddForeignKey
ALTER TABLE `hunts` ADD CONSTRAINT `hunts_clueSetId_fkey` FOREIGN KEY (`clueSetId`) REFERENCES `clue_sets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participants` ADD CONSTRAINT `participants_clueSetId_fkey` FOREIGN KEY (`clueSetId`) REFERENCES `clue_sets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clue_sets` ADD CONSTRAINT `clue_sets_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `games`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
