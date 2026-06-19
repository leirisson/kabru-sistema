import { config } from 'dotenv'
config()

import { PrismaClient, Role } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const senhaHash = await hash('Kabru@adm_2026', 10)

  await prisma.usuario.upsert({
    where: { email: 'admin@kabru.local' },
    update: {},
    create: { nome: 'Administrador', email: 'admin@kabru.local', senhaHash, role: Role.ADMIN },
  })

  console.log('Seed concluído.')
  console.log('Credenciais: admin@kabru.local / senha123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
