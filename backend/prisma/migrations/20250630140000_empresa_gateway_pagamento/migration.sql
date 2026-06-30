-- CreateTable
CREATE TABLE `empresas_gateway_pagamento` (
    `id` VARCHAR(191) NOT NULL,
    `empresa_id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `ambiente` VARCHAR(191) NOT NULL,
    `client_id_enc` TEXT NOT NULL,
    `client_secret_enc` TEXT NOT NULL,
    `certificado_enc` TEXT NOT NULL,
    `chave_privada_enc` TEXT NOT NULL,
    `webhook_secret_enc` TEXT NULL,
    `chave_pix` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pendente',
    `ultimo_erro` TEXT NULL,
    `conectado_em` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `empresas_gateway_pagamento_empresa_id_key`(`empresa_id`),
    INDEX `empresas_gateway_pagamento_empresa_id_idx`(`empresa_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `empresas_gateway_pagamento` ADD CONSTRAINT `empresas_gateway_pagamento_empresa_id_fkey` FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
