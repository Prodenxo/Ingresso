import { existsSync } from 'fs'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const UPLOADS_DIR = join(process.cwd(), 'uploads', 'eventos')

const REPAIR_MAP = [
  {
    nome: 'Empresa inquebrável',
    filename: 'a382c4d6-ac3f-48fe-be8c-251ca6722291.png',
  },
  {
    nome: 'Teste onety',
    filename: 'da80ac16-8a43-49d1-9fa6-78faa1ab709c.png',
  },
]

async function main() {
  for (const item of REPAIR_MAP) {
    const filePath = join(UPLOADS_DIR, item.filename)

    if (!existsSync(filePath)) {
      console.log(`arquivo ausente: ${item.filename}`)
      continue
    }

    const url = `/api/uploads/eventos/${item.filename}`
    const evento = await prisma.evento.findFirst({
      where: { nome: item.nome },
      select: { id: true, nome: true, imagemUrl: true },
    })

    if (!evento) {
      console.log(`evento nao encontrado: ${item.nome}`)
      continue
    }

    await prisma.evento.update({
      where: { id: evento.id },
      data: { imagemUrl: url, bannerUrl: url },
    })

    console.log(`ok: ${evento.nome} -> ${url}`)
  }

  const limpos = await prisma.evento.findMany({
    where: { imagemUrl: { not: null } },
    select: { id: true, nome: true, imagemUrl: true },
  })

  for (const evento of limpos) {
    const filename = evento.imagemUrl?.split('/').pop()
    if (!filename) continue

    const filePath = join(UPLOADS_DIR, filename)
    if (!existsSync(filePath)) {
      await prisma.evento.update({
        where: { id: evento.id },
        data: { imagemUrl: null, bannerUrl: null },
      })
      console.log(`limpo url quebrada: ${evento.nome}`)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
