/*
  Warnings:

  - You are about to drop the column `name` on the `game` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[location]` on the table `Game` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `location` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `game` DROP COLUMN `name`,
    ADD COLUMN `location` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Game_location_key` ON `Game`(`location`);
