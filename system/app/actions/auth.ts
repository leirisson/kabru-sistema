'use server'

import { z } from 'zod'
import { compare } from 'bcryptjs'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createSession, deleteSession } from '@/lib/session'

const loginSchema = z.object({
  email: z.email(),
  senha: z.string().min(1, 'Senha obrigatória'),
})

type LoginState = { erro?: string } | null

export async function login(prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    senha: formData.get('senha'),
  })

  if (!parsed.success) {
    return { erro: parsed.error.issues[0].message }
  }

  const usuario = await prisma.usuario.findUnique({ where: { email: parsed.data.email } })
  if (!usuario) return { erro: 'Email ou senha inválidos' }

  const senhaValida = await compare(parsed.data.senha, usuario.senhaHash)
  if (!senhaValida) return { erro: 'Email ou senha inválidos' }

  await createSession({
    userId: usuario.id,
    role: usuario.role,
    email: usuario.email,
    nome: usuario.nome,
  })

  redirect('/painel')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
