-- DropForeignKey
ALTER TABLE `activities` DROP FOREIGN KEY `activities_userId_fkey`;

-- AlterTable
ALTER TABLE `activities` MODIFY `userId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
