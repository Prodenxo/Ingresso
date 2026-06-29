# PRD - Plataforma SaaS de Gestão de Eventos e Venda de Ingressos

## Nome do Projeto

**EventHub** (nome temporário)

---

## Visão Geral

Desenvolver uma plataforma SaaS multiempresa inspirada na Sympla e Eventbrite, permitindo que organizadores criiem eventos, vendam ingressos online, recebam pagamentos via PIX e Cartão de Crédito, gerem QR Codes únicos para cada ingresso e realizem check-in através da leitura do QR Code.

A plataforma deverá ser totalmente responsiva, moderna, escalável e preparada para operar milhares de eventos simultaneamente.

O sistema deverá utilizar **HeroUI** como biblioteca principal de componentes visuais.

---

## Objetivos

Permitir que qualquer empresa possa:

- Criar sua conta
- Criar eventos
- Vender ingressos
- Controlar lotes
- Receber pagamentos
- Emitir ingressos digitais
- Realizar check-in
- Acompanhar vendas em tempo real

---

## Arquitetura

### Frontend

- Next.js 15
- React 19
- HeroUI
- Tailwind CSS
- React Hook Form
- Zod
- TanStack Query
- TanStack Table
- Framer Motion
- Lucide React

### Backend

- NestJS
- Prisma ORM
- PostgreSQL
- Redis
- BullMQ

Arquitetura modular. Cada domínio deverá possuir:

- Controller
- Service
- Repository
- DTO
- Entity
- Validator

> **Regra:** Não utilizar lógica de negócio nos Controllers.

### Storage

- Cloudflare R2 **ou**
- Amazon S3

### Cache

- Redis

### Processamento Assíncrono

BullMQ — workers responsáveis por:

- Envio de e-mails
- Geração de QR Codes
- Processamento de webhooks
- Notificações
- Exportação de relatórios

---

## Multiempresa

O sistema deverá ser **Multi-Tenant**.

- Toda informação deverá pertencer obrigatoriamente a uma empresa
- Todas as tabelas deverão possuir `empresa_id`
- Nenhum usuário poderá acessar dados de outra empresa

---

## Módulos

### Autenticação

- Login
- Cadastro
- Recuperação de senha
- Refresh Token
- JWT
- Controle de Sessão

### Empresas

Cadastro contendo:

- Nome
- Razão Social
- CNPJ
- Logo
- Cor Primária
- Endereço
- Dados Bancários
- Gateway de Pagamento

### Usuários

Permissões:

| Role | Descrição |
|------|-----------|
| Administrador | Acesso total |
| Financeiro | Módulo financeiro e relatórios |
| Operador | Gestão operacional |
| Marketing | Campanhas e divulgação |
| Check-in | Validação de ingressos |
| Leitor | Leitura somente |

Cada permissão deverá possuir controle granular. **RBAC obrigatório.**

---

## Eventos

Cadastro completo contendo:

- Nome
- Descrição
- Banner
- Imagem
- Categoria
- Data
- Hora
- Cidade
- Estado
- Endereço
- Mapa
- Capacidade
- Status
- Evento Público / Privado
- Evento Online / Presencial / Híbrido

---

## Lotes

Cada evento poderá possuir diversos lotes.

**Exemplos:** Primeiro Lote, Segundo Lote, VIP, Camarote, Pista

Cada lote possui:

- Nome
- Preço
- Quantidade
- Quantidade Vendida
- Período de Venda
- Taxa
- Limite por Compra
- Status

---

## Página Pública

Cada evento deverá possuir uma Landing Page própria.

**Estrutura:**

1. Banner
2. Descrição
3. Data
4. Local
5. Mapa
6. Organizador
7. Ingressos
8. Patrocinadores
9. Perguntas Frequentes
10. Contato
11. Checkout

---

## Checkout

**Fluxo:**

```
Selecionar ingresso
    ↓
Preencher dados
    ↓
Escolher pagamento
    ↓
Efetuar pagamento
    ↓
Webhook confirma pagamento
    ↓
Gerar ingresso
    ↓
Enviar QR Code
```

---

## Pagamentos

Arquitetura baseada em **Providers**.

Criar interface: `PaymentProvider`

**Implementações:**

- `InterPixProvider`
- `AsaasProvider`
- `StripeProvider`

> **Regra:** O restante do sistema nunca deverá depender diretamente do gateway.

### PIX

**Gateway:** Banco Inter

**Fluxo:**

```
Criar Cobrança Pix
    ↓
Receber QR Code Dinâmico
    ↓
Exibir QR Code
    ↓
Receber Webhook
    ↓
Atualizar Pedido
    ↓
Gerar Ingresso
```

### Cartão

**Gateway:** Asaas (opcionalmente Stripe)

**Fluxo:**

```
Criar cobrança
    ↓
Receber webhook
    ↓
Pagamento aprovado
    ↓
Gerar ingresso
```

---

## Pedidos

Cada pedido poderá possuir vários ingressos.

**Status:**

- Pendente
- Pago
- Cancelado
- Expirado
- Estornado

---

## Ingressos

Cada ingresso deverá possuir:

- UUID
- QR Code
- Hash
- JWT Assinado
- Participante
- CPF
- Email
- Telefone
- Status
- Data de Utilização

> **Regra:** Nunca utilizar IDs sequenciais para validação.

---

## QR Code

Cada QR Code deverá representar um **Token único**.

**Fluxo de validação:**

```
Validar Token
    ↓
Validar Evento
    ↓
Validar Empresa
    ↓
Validar Pagamento
    ↓
Validar Status
    ↓
Registrar Entrada
    ↓
Responder Resultado
```

---

## Check-in

Tela específica para operadores. Permitir leitura utilizando câmera do navegador.

**Biblioteca:** `html5-qrcode`

**Ao escanear, exibir:**

- Nome
- Foto (quando existir)
- Tipo de ingresso
- Horário
- Situação

**Estados visuais:**

| Estado | Cor | Mensagem | Detalhes |
|--------|-----|----------|----------|
| Válido | Verde | Entrada Liberada | — |
| Inválido | Vermelho | Ingresso Inválido | — |
| Utilizado | Amarelo | Ingresso já utilizado | Horário, Operador, Local |

---

## Dashboard

### Cards

- Receita
- Pedidos
- Ingressos Vendidos
- Ingressos Disponíveis
- Ticket Médio
- Capacidade
- Conversão

### Gráficos

- Receita por Dia
- Receita por Hora
- Vendas por Lote
- Forma de Pagamento
- Conversão
- Check-ins

---

## Financeiro

- Extrato
- Recebimentos
- Taxas
- Estornos
- Saldo
- Repasses

---

## Relatórios

**Formatos:** CSV, Excel, PDF

**Filtros por:**

- Evento
- Período
- Forma de Pagamento
- Status
- Lote

---

## Notificações

Enviar automaticamente por **e-mail**:

- Confirmação de compra
- QR Code
- Cancelamento
- Alteração de evento
- Lembrete do evento

---

## HeroUI

Utilizar HeroUI como biblioteca principal.

**Componentes obrigatórios:**

Navbar, Sidebar, Card, Table, Drawer, Modal, Input, Textarea, DatePicker, Select, Autocomplete, Accordion, Tabs, Badge, Chip, Pagination, Avatar, Dropdown, Toast, Skeleton, Spinner, Tooltip, Calendar, Charts

---

## Identidade Visual

Visual premium. Inspirado em: **Stripe**, **Linear**, **Vercel**, **Notion**, **Apple**

**Tema:**

- Dark Mode
- Glassmorphism discreto
- Radius médio
- Sombras suaves
- Motion elegante
- Responsivo
- Mobile First

---

## Banco de Dados

**Tabelas mínimas:**

- `empresas`
- `usuarios`
- `usuarios_empresas`
- `eventos`
- `categorias`
- `lotes`
- `pedidos`
- `pedido_itens`
- `pagamentos`
- `ingressos`
- `checkins`
- `webhooks`
- `arquivos`
- `notificacoes`
- `auditoria_logs`
- `configuracoes_empresa`

---

## Segurança

- JWT
- Refresh Token
- RBAC
- Criptografia de senhas
- Rate Limit
- Logs de Auditoria
- Validação de QR Code assinada
- Proteção CSRF
- Proteção XSS
- Proteção SQL Injection

---

## Roadmap

### MVP

- [ ] Cadastro de Empresas
- [ ] Cadastro de Usuários
- [ ] Cadastro de Eventos
- [ ] Cadastro de Lotes
- [ ] Página Pública
- [ ] Checkout
- [ ] PIX
- [ ] Cartão
- [ ] QR Code
- [ ] Check-in
- [ ] Dashboard
- [ ] Relatórios

### Versão 2

- Cupons
- Lista de Espera
- Convites
- Afiliados
- Marketplace
- Split de Pagamento
- Apple Wallet
- Google Wallet
- Aplicativo Mobile
- White Label
- API Pública
- Webhooks
- Integrações
- Check-in Offline

---

## Diretrizes para Desenvolvimento

- Utilizar TypeScript em todo o projeto
- Código limpo, modular e desacoplado
- Componentes reutilizáveis
- Separação clara entre domínio, infraestrutura e apresentação
- Nenhuma regra de negócio deve ficar no frontend
- Todas as integrações externas devem utilizar providers e interfaces
- O sistema deve estar preparado para crescimento horizontal e futuras integrações sem necessidade de refatoração estrutural
