-- CreateTable
CREATE TABLE `CategoryRedirect` (
    `id` VARCHAR(191) NOT NULL,
    `site` VARCHAR(191) NOT NULL DEFAULT 'methstreams',
    `fromSlug` VARCHAR(191) NOT NULL,
    `toSlug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CategoryRedirect_site_fromSlug_key`(`site`, `fromSlug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
