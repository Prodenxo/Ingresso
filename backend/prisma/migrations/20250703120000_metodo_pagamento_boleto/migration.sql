-- AlterEnum (MySQL)
ALTER TABLE `pagamentos` MODIFY `metodo` ENUM('PIX', 'CARTAO', 'BOLETO') NOT NULL;
