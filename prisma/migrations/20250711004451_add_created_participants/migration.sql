/*
  Warnings:

  - You are about to drop the `_usergames` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_usergames` DROP FOREIGN KEY `_UserGames_A_fkey`;

-- DropForeignKey
ALTER TABLE `_usergames` DROP FOREIGN KEY `_UserGames_B_fkey`;

-- DropTable
DROP TABLE `_usergames`;

-- CreateTable
CREATE TABLE `Participant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `gameId` INTEGER NOT NULL,
    `registrationDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `participantStatus` ENUM('PENDING', 'ACTIVE', 'ELIMINATED', 'FINISHED', 'DISQUALIFIED') NOT NULL DEFAULT 'PENDING',

    UNIQUE INDEX `Participant_userId_gameId_key`(`userId`, `gameId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Participant` ADD CONSTRAINT `Participant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Participant` ADD CONSTRAINT `Participant_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `Game`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
