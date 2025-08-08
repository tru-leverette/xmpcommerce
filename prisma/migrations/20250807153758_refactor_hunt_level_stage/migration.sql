/*
  Warnings:

  - You are about to drop the column `participantId` on the `wallets` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[clueSetId,levelNumber,stageNumber]` on the table `hunts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `wallets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `levelNumber` to the `hunts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stageNumber` to the `hunts` table without a default value. This is not possible if the table is not empty.
  - Made the column `clueSetId` on table `hunts` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `userId` to the `wallets` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `hunts` DROP FOREIGN KEY `hunts_clueSetId_fkey`;

-- DropForeignKey
ALTER TABLE `hunts` DROP FOREIGN KEY `hunts_stageId_fkey`;

-- DropForeignKey
ALTER TABLE `wallets` DROP FOREIGN KEY `wallets_participantId_fkey`;

-- DropIndex
DROP INDEX `hunts_stageId_huntNumber_key` ON `hunts`;

-- DropIndex
DROP INDEX `wallets_participantId_key` ON `wallets`;

-- Add columns as nullable first
ALTER TABLE `hunts` ADD COLUMN `levelNumber` INTEGER NULL,
    ADD COLUMN `stageNumber` INTEGER NULL,
    MODIFY `stageId` VARCHAR(191) NULL,
    MODIFY `clueSetId` VARCHAR(191) NOT NULL;

-- Set safe defaults for existing rows (set to 1 if unknown)
UPDATE `hunts` SET `levelNumber` = 1 WHERE `levelNumber` IS NULL;
UPDATE `hunts` SET `stageNumber` = 1 WHERE `stageNumber` IS NULL;

-- Now set NOT NULL
ALTER TABLE `hunts` MODIFY `levelNumber` INTEGER NOT NULL;
ALTER TABLE `hunts` MODIFY `stageNumber` INTEGER NOT NULL;

-- Add userId as nullable first
ALTER TABLE `wallets` ADD COLUMN `userId` VARCHAR(191) NULL;

-- Set userId for existing rows (set to a valid user or placeholder, update this as needed)
UPDATE `wallets` SET `userId` = (SELECT id FROM users LIMIT 1) WHERE `userId` IS NULL;

-- Now set NOT NULL and drop participantId
ALTER TABLE `wallets` DROP COLUMN `participantId`;
ALTER TABLE `wallets` MODIFY `userId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `hunts_clueSetId_levelNumber_stageNumber_key` ON `hunts`(`clueSetId`, `levelNumber`, `stageNumber`);

-- CreateIndex
CREATE UNIQUE INDEX `wallets_userId_key` ON `wallets`(`userId`);

-- AddForeignKey
ALTER TABLE `hunts` ADD CONSTRAINT `hunts_clueSetId_fkey` FOREIGN KEY (`clueSetId`) REFERENCES `clue_sets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE `wallets` ADD CONSTRAINT `wallets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
