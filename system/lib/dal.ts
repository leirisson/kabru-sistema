import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession, type SessionPayload } from './session'
import { prisma } from './prisma'
import { getRotasPermitidasRole } from './status-flow'

export const verifySession = cache(async (): Promise<SessionPayload> => {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
})

export const getSessionUser = cache(async () => {
  const session = await verifySession()
  return prisma.usuario.findUniqueOrThrow({ where: { id: session.userId } })
})

// Verifica se o usuário logado tem acesso à rota informada; redireciona para /painel caso não tenha.
export async function verifyRotaPermitida(rota: string) {
  const session = await verifySession()
  if (session.role === 'ADMIN') return session
  const rotas = await getRotasPermitidasRole(session.role, session.userId)
  if (!rotas.includes(rota)) redirect('/painel')
  return session
}
