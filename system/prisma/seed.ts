import { config } from 'dotenv'
config()

import { PrismaClient, Role } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const PERMISSOES_PADRAO: Record<string, string[]> = {
  ADMIN:       ['SEPARACAO', 'CONFERENCIA', 'CONFERIDO', 'FATURAMENTO', 'SEPARACAO_DESTINATARIO', 'CONCLUIDO'],
  ESTOQUE:     ['SEPARACAO', 'CONFERENCIA', 'CONFERIDO', 'FATURAMENTO', 'SEPARACAO_DESTINATARIO', 'CONCLUIDO'],
  CONFERENCIA: ['SEPARACAO', 'CONFERENCIA', 'CONFERIDO', 'FATURAMENTO', 'SEPARACAO_DESTINATARIO', 'CONCLUIDO'],
  FATURAMENTO: ['SEPARACAO_DESTINATARIO'],
  EXPEDICAO:   ['SEPARACAO_DESTINATARIO', 'CONCLUIDO'],
  VENDEDOR:    [],
}

async function main() {
  const senhaHash = await hash('Kabru@adm_2026', 10)

  await prisma.usuario.upsert({
    where: { email: 'admin@kabru.com' },
    update: { senhaHash },
    create: { nome: 'Administrador', email: 'admin@kabru.com', senhaHash, role: Role.ADMIN },
  })

  for (const [role, podeAvancarPara] of Object.entries(PERMISSOES_PADRAO)) {
    await prisma.permissaoRole.upsert({
      where: { role: role as Role },
      update: { podeAvancarPara },
      create: { role: role as Role, podeAvancarPara },
    })
  }

  console.log('Seed concluído.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
