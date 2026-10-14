-- CreateTable
CREATE TABLE `SiteSettings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `logoTextMain` VARCHAR(191) NOT NULL DEFAULT 'SPORT',
    `logoTextAccent` VARCHAR(191) NOT NULL DEFAULT 'EAST',
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
