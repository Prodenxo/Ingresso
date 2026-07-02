-- AlterTable
ALTER TABLE `eventos` ADD COLUMN `modo_checkin` ENUM('PORTA_UNICA', 'BATE_PONTO') NOT NULL DEFAULT 'PORTA_UNICA',
    ADD COLUMN `checkin_dias` INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE `eventos_pontos_checkin` (
    `id` VARCHAR(191) NOT NULL,
    `empresa_id` VARCHAR(191) NOT NULL,
    `evento_id` VARCHAR(191) NOT NULL,
    `ordem` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `eventos_pontos_checkin_empresa_id_idx`(`empresa_id`),
    INDEX `eventos_pontos_checkin_evento_id_idx`(`evento_id`),
    UNIQUE INDEX `eventos_pontos_checkin_evento_id_ordem_key`(`evento_id`, `ordem`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `checkins` ADD COLUMN `ponto_checkin_id` VARCHAR(191) NULL,
    ADD COLUMN `dia_evento` INTEGER NULL;

-- CreateIndex
CREATE INDEX `checkins_ponto_checkin_id_idx` ON `checkins`(`ponto_checkin_id`);

-- AddForeignKey
ALTER TABLE `eventos_pontos_checkin` ADD CONSTRAINT `eventos_pontos_checkin_evento_id_fkey` FOREIGN KEY (`evento_id`) REFERENCES `eventos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `checkins` ADD CONSTRAINT `checkins_ponto_checkin_id_fkey` FOREIGN KEY (`ponto_checkin_id`) REFERENCES `eventos_pontos_checkin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
