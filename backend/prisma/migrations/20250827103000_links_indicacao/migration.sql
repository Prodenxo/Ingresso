-- CreateTable
CREATE TABLE `links_indicacao` (
    `id` VARCHAR(191) NOT NULL,
    `empresa_id` VARCHAR(191) NOT NULL,
    `evento_id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `cliques` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `links_indicacao_slug_key`(`slug`),
    INDEX `links_indicacao_empresa_id_idx`(`empresa_id`),
    INDEX `links_indicacao_evento_id_idx`(`evento_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `pedidos` ADD COLUMN `link_indicacao_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `pedidos_link_indicacao_id_idx` ON `pedidos`(`link_indicacao_id`);

-- AddForeignKey
ALTER TABLE `links_indicacao` ADD CONSTRAINT `links_indicacao_empresa_id_fkey` FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `links_indicacao` ADD CONSTRAINT `links_indicacao_evento_id_fkey` FOREIGN KEY (`evento_id`) REFERENCES `eventos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_link_indicacao_id_fkey` FOREIGN KEY (`link_indicacao_id`) REFERENCES `links_indicacao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
