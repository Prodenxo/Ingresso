-- AlterTable
ALTER TABLE `usuarios_empresas` ADD COLUMN `acesso_cursos` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `cursos` (
    `id` VARCHAR(191) NOT NULL,
    `empresa_id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `capa_url` VARCHAR(191) NULL,
    `status` ENUM('RASCUNHO', 'PUBLICADO', 'ARQUIVADO') NOT NULL DEFAULT 'RASCUNHO',
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `cursos_empresa_id_idx`(`empresa_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cursos_modulos` (
    `id` VARCHAR(191) NOT NULL,
    `empresa_id` VARCHAR(191) NOT NULL,
    `curso_id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `cursos_modulos_empresa_id_idx`(`empresa_id`),
    INDEX `cursos_modulos_curso_id_idx`(`curso_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cursos_aulas` (
    `id` VARCHAR(191) NOT NULL,
    `empresa_id` VARCHAR(191) NOT NULL,
    `modulo_id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `tipo` ENUM('VIDEO', 'PDF', 'TEXTO') NOT NULL,
    `conteudo_url` TEXT NULL,
    `conteudo_texto` TEXT NULL,
    `duracao_minutos` INTEGER NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `cursos_aulas_empresa_id_idx`(`empresa_id`),
    INDEX `cursos_aulas_modulo_id_idx`(`modulo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cursos_usuarios_acesso` (
    `id` VARCHAR(191) NOT NULL,
    `empresa_id` VARCHAR(191) NOT NULL,
    `curso_id` VARCHAR(191) NOT NULL,
    `usuario_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cursos_usuarios_acesso_empresa_id_idx`(`empresa_id`),
    INDEX `cursos_usuarios_acesso_usuario_id_idx`(`usuario_id`),
    UNIQUE INDEX `cursos_usuarios_acesso_curso_id_usuario_id_key`(`curso_id`, `usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cursos_aulas_progresso` (
    `id` VARCHAR(191) NOT NULL,
    `empresa_id` VARCHAR(191) NOT NULL,
    `aula_id` VARCHAR(191) NOT NULL,
    `usuario_id` VARCHAR(191) NOT NULL,
    `concluida` BOOLEAN NOT NULL DEFAULT false,
    `progresso_pct` INTEGER NOT NULL DEFAULT 0,
    `concluida_em` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `cursos_aulas_progresso_empresa_id_idx`(`empresa_id`),
    INDEX `cursos_aulas_progresso_usuario_id_idx`(`usuario_id`),
    UNIQUE INDEX `cursos_aulas_progresso_aula_id_usuario_id_key`(`aula_id`, `usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cursos` ADD CONSTRAINT `cursos_empresa_id_fkey` FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cursos_modulos` ADD CONSTRAINT `cursos_modulos_curso_id_fkey` FOREIGN KEY (`curso_id`) REFERENCES `cursos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cursos_aulas` ADD CONSTRAINT `cursos_aulas_modulo_id_fkey` FOREIGN KEY (`modulo_id`) REFERENCES `cursos_modulos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cursos_usuarios_acesso` ADD CONSTRAINT `cursos_usuarios_acesso_empresa_id_fkey` FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cursos_usuarios_acesso` ADD CONSTRAINT `cursos_usuarios_acesso_curso_id_fkey` FOREIGN KEY (`curso_id`) REFERENCES `cursos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cursos_usuarios_acesso` ADD CONSTRAINT `cursos_usuarios_acesso_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cursos_aulas_progresso` ADD CONSTRAINT `cursos_aulas_progresso_aula_id_fkey` FOREIGN KEY (`aula_id`) REFERENCES `cursos_aulas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cursos_aulas_progresso` ADD CONSTRAINT `cursos_aulas_progresso_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
