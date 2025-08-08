-- AddForeignKey
ALTER TABLE `hunts` ADD CONSTRAINT `hunts_stageId_fkey` FOREIGN KEY (`stageId`) REFERENCES `stages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
