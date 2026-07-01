-- AlterEnum (MySQL: modify column)
ALTER TABLE `usuarios_empresas` MODIFY `papel` ENUM('ADMINISTRADOR', 'FINANCEIRO', 'OPERADOR', 'MARKETING', 'CHECKIN', 'LEITOR', 'MEMBRO') NOT NULL;

-- AlterTable
ALTER TABLE `empresas` ADD COLUMN `slug_membro` VARCHAR(191) NULL,
    ADD COLUMN `codigo_convite` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `empresas_slug_membro_key` ON `empresas`(`slug_membro`);
CREATE UNIQUE INDEX `empresas_codigo_convite_key` ON `empresas`(`codigo_convite`);
