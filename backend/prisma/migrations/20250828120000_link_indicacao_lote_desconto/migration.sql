-- AlterTable
ALTER TABLE `links_indicacao` ADD COLUMN `lote_id` VARCHAR(191) NULL,
    ADD COLUMN `desconto_percentual` DECIMAL(5, 2) NULL;

-- CreateIndex
CREATE INDEX `links_indicacao_lote_id_idx` ON `links_indicacao`(`lote_id`);

-- AddForeignKey
ALTER TABLE `links_indicacao` ADD CONSTRAINT `links_indicacao_lote_id_fkey` FOREIGN KEY (`lote_id`) REFERENCES `lotes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
