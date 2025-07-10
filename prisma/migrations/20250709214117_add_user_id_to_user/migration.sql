-- Step 1: Add as nullable
ALTER TABLE `user` ADD COLUMN `userId` VARCHAR(191);

-- Step 2: Populate with unique values for existing users
UPDATE `user` SET `userId` = CONCAT('user_', id) WHERE `userId` IS NULL;

-- Step 3: Make NOT NULL and unique
ALTER TABLE `user` MODIFY COLUMN `userId` VARCHAR(191) NOT NULL;
CREATE UNIQUE INDEX `User_userId_key` ON `user`(`userId`);