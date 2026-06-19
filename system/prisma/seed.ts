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
    where: { email: 'admin@kabru.com' },
    update: {},
    create: { nome: 'Administrador', email: 'admin@kabru.com', senhaHash, role: Role.ADMIN },
  })

  console.log('Seed concluído.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
