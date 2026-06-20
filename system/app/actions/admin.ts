'use server'

import { z } from 'zod'
import { hash } from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import type { Role, StatusPedido } from '@prisma/client'

async function checarAdmin() {
  const session = await verifySession()
  if (session.role !== 'ADMIN') return { erro: 'Sem permissão' } as const
  return null
}

const usuarioSchema = z.object({
  nome: z.string().min(2),
  email: z.email(),
  senha: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'VENDEDOR', 'ESTOQUE', 'CONFERENCIA', 'FATURAMENTO', 'EXPEDICAO']),
})

type UsuarioState = { erro?: string; ok?: boolean } | null

export async function criarUsuario(prevState: UsuarioState, formData: FormData): Promise<UsuarioState> {
  const bloqueio = await checarAdmin()
  if (bloqueio) return bloqueio

  const parsed = usuarioSchema.extend({ senha: z.string().min(6) }).safeParse({
    nome: formData.get('nome'),
    email: formData.get('email'),
    senha: formData.get('senha'),
    role: formData.get('role'),
  })

  if (!parsed.success) return { erro: parsed.error.issues[0].message }

  const jaExiste = await prisma.usuario.findUnique({ where: { email: parsed.data.email } })
  if (jaExiste) return { erro: 'Email já cadastrado' }

  const senhaHash = await hash(parsed.data.senha, 10)

  await prisma.usuario.create({
    data: {
      nome: parsed.data.nome,
      email: parsed.data.email,
      senhaHash,
      role: parsed.data.role as Role,
    },
  })

  revalidatePath('/admin/usuarios', 'page')
  return { ok: true }
}

export async function atualizarUsuario(prevState: UsuarioState, formData: FormData): Promise<UsuarioState> {
  const bloqueio = await checarAdmin()
  if (bloqueio) return bloqueio

  const id = formData.get('id') as string
  const parsed = usuarioSchema.safeParse({
    nome: formData.get('nome'),
    email: formData.get('email'),
    role: formData.get('role'),
  })

  if (!parsed.success) return { erro: parsed.error.issues[0].message }

  const dados: Record<string, unknown> = {
    nome: parsed.data.nome,
    email: parsed.data.email,
    role: parsed.data.role as Role,
  }

  const novaSenha = formData.get('senha') as string
  if (novaSenha?.trim()) {
    dados.senhaHash = await hash(novaSenha, 10)
  }

  await prisma.usuario.update({ where: { id }, data: dados })
  revalidatePath('/admin/usuarios', 'page')
  return { ok: true }
}

export async function deletarUsuario(id: string): Promise<{ erro?: string; ok?: boolean }> {
  const bloqueio = await checarAdmin()
  if (bloqueio) return bloqueio

  await prisma.usuario.delete({ where: { id } })
  revalidatePath('/admin/usuarios', 'page')
  return { ok: true }
}

export async function atualizarPermissaoRole(
  prevState: { erro?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ erro?: string; ok?: boolean }> {
  const bloqueio = await checarAdmin()
  if (bloqueio) return bloqueio

  const role = formData.get('role') as string
  const podeAvancarPara = formData.getAll('podeAvancarPara') as string[]

  await prisma.permissaoRole.upsert({
    where: { role: role as Role },
    update: { podeAvancarPara },
    create: { role: role as Role, podeAvancarPara },
  })

  revalidatePath('/admin/permissoes', 'page')
  revalidatePath('/painel', 'page')
  return { ok: true }
}

const slaSchema = z.object({
  status: z.string(),
  avisoMinutos: z.number().int().positive(),
  criticoMinutos: z.number().int().positive(),
})

type SlaState = { erro?: string; ok?: boolean } | null

export async function atualizarSla(prevState: SlaState, formData: FormData): Promise<SlaState> {
  const bloqueio = await checarAdmin()
  if (bloqueio) return bloqueio

  const parsed = slaSchema.safeParse({
    status: formData.get('status'),
    avisoMinutos: Number(formData.get('avisoMinutos')),
    criticoMinutos: Number(formData.get('criticoMinutos')),
  })

  if (!parsed.success) return { erro: parsed.error.issues[0].message }

  await prisma.slaConfig.upsert({
    where: { status: parsed.data.status as StatusPedido },
    update: {
      avisoMinutos: parsed.data.avisoMinutos,
      criticoMinutos: parsed.data.criticoMinutos,
    },
    create: {
      status: parsed.data.status as StatusPedido,
      avisoMinutos: parsed.data.avisoMinutos,
      criticoMinutos: parsed.data.criticoMinutos,
    },
  })

  revalidatePath('/admin/sla', 'page')
  return { ok: true }
}
