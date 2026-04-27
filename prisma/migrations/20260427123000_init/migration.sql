CREATE TABLE `Plant` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `cultivar` VARCHAR(191) NULL,
  `displayOrder` INTEGER NOT NULL DEFAULT 0,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `MeasurementSession` (
  `id` VARCHAR(191) NOT NULL,
  `measuredAt` DATETIME(3) NOT NULL,
  `label` VARCHAR(191) NULL,
  `note` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PlantMeasurement` (
  `id` VARCHAR(191) NOT NULL,
  `sessionId` VARCHAR(191) NOT NULL,
  `plantId` VARCHAR(191) NOT NULL,
  `weight` DECIMAL(10, 2) NOT NULL,
  `delta` DECIMAL(10, 2) NULL,
  `deltaPercent` DECIMAL(8, 4) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `EnvironmentReading` (
  `id` VARCHAR(191) NOT NULL,
  `entityId` VARCHAR(191) NOT NULL,
  `kind` VARCHAR(191) NOT NULL,
  `value` DECIMAL(10, 3) NOT NULL,
  `unit` VARCHAR(191) NULL,
  `recordedAt` DATETIME(3) NOT NULL,
  `raw` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SyncLog` (
  `id` VARCHAR(191) NOT NULL,
  `source` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `finishedAt` DATETIME(3) NULL,
  `message` TEXT NULL,
  `rowsInserted` INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `Plant_isActive_displayOrder_idx` ON `Plant`(`isActive`, `displayOrder`);
CREATE INDEX `MeasurementSession_measuredAt_idx` ON `MeasurementSession`(`measuredAt`);
CREATE UNIQUE INDEX `PlantMeasurement_sessionId_plantId_key` ON `PlantMeasurement`(`sessionId`, `plantId`);
CREATE INDEX `PlantMeasurement_plantId_createdAt_idx` ON `PlantMeasurement`(`plantId`, `createdAt`);
CREATE UNIQUE INDEX `EnvironmentReading_entityId_recordedAt_key` ON `EnvironmentReading`(`entityId`, `recordedAt`);
CREATE INDEX `EnvironmentReading_kind_recordedAt_idx` ON `EnvironmentReading`(`kind`, `recordedAt`);

ALTER TABLE `PlantMeasurement` ADD CONSTRAINT `PlantMeasurement_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `MeasurementSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `PlantMeasurement` ADD CONSTRAINT `PlantMeasurement_plantId_fkey` FOREIGN KEY (`plantId`) REFERENCES `Plant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
