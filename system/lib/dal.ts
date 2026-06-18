import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession, type SessionPayload } from './session'
import { prisma } from './prisma'

export const verifySession = cache(async (): Promise<SessionPayload> => {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
})

export const getSessionUser = cache(async () => {
  const session = await verifySession()
  return prisma.usuario.findUniqueOrThrow({ where: { id: session.userId } })
})
