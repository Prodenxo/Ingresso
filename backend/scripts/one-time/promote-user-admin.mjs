import { PrismaClient } from '@prisma/client'

const emailArg = process.argv[2]?.trim().toLowerCase()
const email = emailArg || 'maria.eduarda@empresainquebravel.com.br'

const prisma = new PrismaClient()

try {
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: {
      empresas: {
        include: {
          empresa: {
            select: { id: true, nome: true, cnpj: true },
          },
        },
      },
    },
  })

  if (!usuario) {
    console.error(`Usuário não encontrado: ${email}`)
    process.exit(1)
  }

  if (usuario.empresas.length === 0) {
    console.error(
      `Usuário ${email} não está vinculado a nenhuma empresa. Vincule antes de promover.`,
    )
    process.exit(1)
  }

  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({
      where: { id: usuario.id },
      data: {
        tipoConta: 'ORGANIZADOR',
        ativo: true,
      },
    })

    for (const vinculo of usuario.empresas) {
      await tx.usuarioEmpresa.update({
        where: { id: vinculo.id },
        data: {
          papel: 'ADMINISTRADOR',
          acessoCursos: true,
          permissoes: [],
        },
      })
    }
  })

  const atualizado = await prisma.usuario.findUnique({
    where: { id: usuario.id },
    select: {
      id: true,
      nome: true,
      email: true,
      tipoConta: true,
      empresas: {
        select: {
          papel: true,
          acessoCursos: true,
          empresa: { select: { id: true, nome: true } },
        },
      },
    },
  })

  console.log('Usuária promovida a administradora com sucesso:')
  console.log(JSON.stringify(atualizado, null, 2))
} finally {
  await prisma.$disconnect()
}
