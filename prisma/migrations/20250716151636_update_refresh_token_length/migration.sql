-- DropIndex
DROP INDEX `refresh_tokens_token_idx` ON `refresh_tokens`;

-- AlterTable
ALTER TABLE `refresh_tokens` MODIFY `token` VARCHAR(500) NOT NULL;
