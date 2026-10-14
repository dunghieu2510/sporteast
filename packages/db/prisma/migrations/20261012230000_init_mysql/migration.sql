-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `avatarUrl` TEXT NULL,
    `role` ENUM('VIEWER', 'CREATOR', 'MODERATOR', 'ADMIN') NOT NULL DEFAULT 'VIEWER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sport` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NULL,

    UNIQUE INDEX `Sport_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `League` (
    `id` VARCHAR(191) NOT NULL,
    `sportId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `shortName` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#64748b',
    `icon` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `logoUrl` TEXT NULL,
    `season` VARCHAR(191) NULL,
    `externalId` VARCHAR(191) NULL,

    UNIQUE INDEX `League_slug_key`(`slug`),
    UNIQUE INDEX `League_externalId_key`(`externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Team` (
    `id` VARCHAR(191) NOT NULL,
    `leagueId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `shortName` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `logoUrl` TEXT NULL,
    `primaryColor` VARCHAR(191) NOT NULL DEFAULT '#64748b',
    `secondaryColor` VARCHAR(191) NOT NULL DEFAULT '#0f172a',
    `externalId` VARCHAR(191) NULL,

    UNIQUE INDEX `Team_slug_key`(`slug`),
    UNIQUE INDEX `Team_externalId_key`(`externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Match` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `leagueId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `homeTeamId` VARCHAR(191) NULL,
    `awayTeamId` VARCHAR(191) NULL,
    `startTime` DATETIME(3) NOT NULL,
    `status` ENUM('SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED') NOT NULL DEFAULT 'SCHEDULED',
    `homeScore` INTEGER NOT NULL DEFAULT 0,
    `awayScore` INTEGER NOT NULL DEFAULT 0,
    `period` INTEGER NULL,
    `clock` VARCHAR(191) NULL,
    `venue` VARCHAR(191) NULL,
    `externalId` VARCHAR(191) NULL,
    `details` JSON NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Match_slug_key`(`slug`),
    UNIQUE INDEX `Match_externalId_key`(`externalId`),
    INDEX `Match_status_startTime_idx`(`status`, `startTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MatchEvent` (
    `id` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NULL,
    `type` ENUM('SCORE', 'PENALTY', 'PERIOD_START', 'PERIOD_END', 'FINISH', 'OTHER') NOT NULL,
    `period` INTEGER NOT NULL,
    `clock` VARCHAR(191) NULL,
    `detail` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MatchEvent_matchId_createdAt_idx`(`matchId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Channel` (
    `id` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `handle` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `bio` TEXT NULL,
    `avatarUrl` TEXT NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Channel_ownerId_key`(`ownerId`),
    UNIQUE INDEX `Channel_handle_key`(`handle`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Stream` (
    `id` VARCHAR(191) NOT NULL,
    `channelId` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `status` ENUM('IDLE', 'LIVE', 'ENDED') NOT NULL DEFAULT 'IDLE',
    `contentSource` ENUM('UGC', 'OFFICIAL_EMBED', 'LICENSED') NOT NULL DEFAULT 'UGC',
    `streamKeyHash` VARCHAR(191) NULL,
    `playbackId` VARCHAR(191) NULL,
    `embedUrl` TEXT NULL,
    `viewerPeak` INTEGER NOT NULL DEFAULT 0,
    `startedAt` DATETIME(3) NULL,
    `endedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Stream_streamKeyHash_key`(`streamKeyHash`),
    INDEX `Stream_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vod` (
    `id` VARCHAR(191) NOT NULL,
    `streamId` VARCHAR(191) NOT NULL,
    `url` TEXT NOT NULL,
    `durationSec` INTEGER NOT NULL,
    `thumbnailUrl` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Highlight` (
    `id` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `url` TEXT NOT NULL,
    `thumbnailUrl` TEXT NULL,
    `source` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Follow` (
    `userId` VARCHAR(191) NOT NULL,
    `targetType` ENUM('TEAM', 'LEAGUE', 'CHANNEL') NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Follow_targetType_targetId_idx`(`targetType`, `targetId`),
    PRIMARY KEY (`userId`, `targetType`, `targetId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Prediction` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `homePred` INTEGER NOT NULL,
    `awayPred` INTEGER NOT NULL,
    `points` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Prediction_userId_matchId_key`(`userId`, `matchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Report` (
    `id` VARCHAR(191) NOT NULL,
    `reporterId` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `reason` TEXT NOT NULL,
    `status` ENUM('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'OPEN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DmcaRequest` (
    `id` VARCHAR(191) NOT NULL,
    `streamId` VARCHAR(191) NOT NULL,
    `claimant` VARCHAR(191) NOT NULL,
    `evidenceUrl` TEXT NOT NULL,
    `status` ENUM('RECEIVED', 'TAKEN_DOWN', 'REJECTED') NOT NULL DEFAULT 'RECEIVED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `handledAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `League` ADD CONSTRAINT `League_sportId_fkey` FOREIGN KEY (`sportId`) REFERENCES `Sport`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Team` ADD CONSTRAINT `Team_leagueId_fkey` FOREIGN KEY (`leagueId`) REFERENCES `League`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_leagueId_fkey` FOREIGN KEY (`leagueId`) REFERENCES `League`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_homeTeamId_fkey` FOREIGN KEY (`homeTeamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_awayTeamId_fkey` FOREIGN KEY (`awayTeamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchEvent` ADD CONSTRAINT `MatchEvent_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchEvent` ADD CONSTRAINT `MatchEvent_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Channel` ADD CONSTRAINT `Channel_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Stream` ADD CONSTRAINT `Stream_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Stream` ADD CONSTRAINT `Stream_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vod` ADD CONSTRAINT `Vod_streamId_fkey` FOREIGN KEY (`streamId`) REFERENCES `Stream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Highlight` ADD CONSTRAINT `Highlight_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Follow` ADD CONSTRAINT `Follow_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prediction` ADD CONSTRAINT `Prediction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prediction` ADD CONSTRAINT `Prediction_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DmcaRequest` ADD CONSTRAINT `DmcaRequest_streamId_fkey` FOREIGN KEY (`streamId`) REFERENCES `Stream`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
