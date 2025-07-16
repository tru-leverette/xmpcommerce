/*
  Warnings:

  - Renamed column `theme` to `location` on the `games` table.

*/
-- AlterTable - Rename theme column to location
ALTER TABLE `games` CHANGE COLUMN `theme` `location` VARCHAR(191) NOT NULL;
