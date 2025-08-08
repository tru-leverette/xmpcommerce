-- AlterTable
ALTER TABLE `participants` ADD COLUMN `registrationCity` VARCHAR(191) NULL,
    ADD COLUMN `registrationLatitude` DOUBLE NULL,
    ADD COLUMN `registrationLongitude` DOUBLE NULL;
