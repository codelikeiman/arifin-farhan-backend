-- AlterTable
ALTER TABLE `users` ADD COLUMN `email_verified_at` DATETIME(3) NULL,
    ADD COLUMN `verification_code` VARCHAR(191) NULL,
    ADD COLUMN `verification_expires` DATETIME(3) NULL;
