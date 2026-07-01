import { PrismaClient } from '@prisma/client'

const email = process.argv[2] ?? 'teste2@teste2.com'
const prisma = new PrismaClient()

try {
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
    },
  })

  const pedidos = await prisma.pedido.findMany({
    where: { compradorEmail: email },
    select: {
      codigo: true,
      compradorCpf: true,
      compradorNome: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const ingressos = await prisma.ingresso.findMany({
    where: { participanteEmail: email },
    select: {
      participanteNome: true,
      participanteCpf: true,
      qrCodeUrl: true,
    },
    take: 5,
  })

  console.log(JSON.stringify({ usuario, pedidos, ingressos }, null, 2))
} finally {
  await prisma.$disconnect()
}
