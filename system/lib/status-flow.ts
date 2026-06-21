import type { Role, StatusPedido } from '@prisma/client'
import { prisma } from '@/lib/prisma'
export { LABEL_STATUS, STATUS_KANBAN, NEXT_STATUS, ROTAS_CONFIGURÁVEIS } from '@/lib/status-constants'
import { ROTAS_CONFIGURÁVEIS } from '@/lib/status-constants' // importação local para uso abaixo

export type RotaHref = typeof ROTAS_CONFIGURÁVEIS[number]['href']

// Rotas padrão por role (usadas como fallback quando o banco está vazio)
export const ROTAS_PADRÃO: Record<Role, string[]> = {
  ADMIN:        ROTAS_CONFIGURÁVEIS.map((r) => r.href),
  VENDEDOR:     ['/dashboard', '/painel', '/pedidos', '/financeiro', '/pedidos/importar'],
  ESTOQUE:      ['/dashboard', '/painel', '/pedidos'],
  CONFERENCIA:  ['/dashboard', '/painel', '/pedidos'],
  FATURAMENTO:  ['/dashboard', '/painel', '/pedidos', '/financeiro'],
  EXPEDICAO:    ['/dashboard', '/painel', '/pedidos'],
}


export const ROLE_PODE_AVANCAR: Record<Role, StatusPedido[]> = {
  ADMIN:        ['SEPARACAO', 'CONFERENCIA', 'CONFERIDO', 'FATURAMENTO', 'SEPARACAO_DESTINATARIO', 'CONCLUIDO'],
  ESTOQUE:      ['SEPARACAO', 'CONFERENCIA', 'CONFERIDO', 'FATURAMENTO', 'SEPARACAO_DESTINATARIO', 'CONCLUIDO'],
  CONFERENCIA:  ['SEPARACAO', 'CONFERENCIA', 'CONFERIDO', 'FATURAMENTO', 'SEPARACAO_DESTINATARIO', 'CONCLUIDO'],
  FATURAMENTO:  ['SEPARACAO_DESTINATARIO'],
  EXPEDICAO:    ['SEPARACAO_DESTINATARIO', 'CONCLUIDO'],
  VENDEDOR:     [],
}

const ROLES_ALL: Role[] = ['ADMIN', 'VENDEDOR', 'ESTOQUE', 'CONFERENCIA', 'FATURAMENTO', 'EXPEDICAO']

async function fetchPermissaoRows() {
  return prisma.permissaoRole.findMany()
}

// Busca permissões de runtime por role (sem considerar sobrescrita por usuário).
// Usado internamente. Para checar o usuário logado, use getPermissoesUsuario().
export async function getPermissoesRoles(): Promise<Record<Role, StatusPedido[]>> {
  const rows = await fetchPermissaoRows()
  if (rows.length === 0) return { ...ROLE_PODE_AVANCAR }

  const result = Object.fromEntries(ROLES_ALL.map((r) => [r, [] as StatusPedido[]])) as Record<Role, StatusPedido[]>

  for (const row of rows) {
    if (row.role === 'ADMIN') continue
    result[row.role] = row.podeAvancarPara as StatusPedido[]
  }

  result['ADMIN'] = [...ROLE_PODE_AVANCAR['ADMIN']]
  return result
}

// Versão híbrida: retorna permissões considerando sobrescrita por usuário individual.
// Para o usuário logado no painel/kanban.
export async function getPermissoesRolesParaUsuario(
  usuarioId: string,
  role: Role,
): Promise<Record<Role, StatusPedido[]>> {
  const base = await getPermissoesRoles()
  const permUsuario = await prisma.permissaoUsuario.findUnique({ where: { usuarioId } })
  if (permUsuario) {
    base[role] = permUsuario.podeAvancarPara as StatusPedido[]
  }
  return base
}

export type PermissoesAdminData = {
  podeAvancarPara: Record<Role, StatusPedido[]>
  rotasPermitidas: Record<Role, string[]>
}

// Busca permissões para exibir na tela de admin: usa os defaults como padrão visual
// para roles ainda não salvas no banco. ADMIN é excluído pois não é configurável.
export async function getPermissoesRolesAdmin(): Promise<PermissoesAdminData> {
  const rows = await fetchPermissaoRows()
  const podeAvancarPara = Object.fromEntries(
    ROLES_ALL.map((r) => [r, [...ROLE_PODE_AVANCAR[r]]])
  ) as Record<Role, StatusPedido[]>
  const rotasPermitidas = Object.fromEntries(
    ROLES_ALL.map((r) => [r, [...ROTAS_PADRÃO[r]]])
  ) as Record<Role, string[]>

  for (const row of rows) {
    if (row.role === 'ADMIN') continue
    podeAvancarPara[row.role] = row.podeAvancarPara as StatusPedido[]
    rotasPermitidas[row.role] = row.rotasPermitidas
  }
  return { podeAvancarPara, rotasPermitidas }
}

// Busca permissões efetivas de um usuário: permissão individual sobrescreve a do role.
// Usado pelo navbar e por verifyRotaPermitida.
export async function getPermissoesUsuario(usuarioId: string, role: Role): Promise<{
  rotasPermitidas: string[]
  podeAvancarPara: StatusPedido[]
}> {
  if (role === 'ADMIN') {
    const todasRotas = ROTAS_CONFIGURÁVEIS.map((r) => r.href)
    return { rotasPermitidas: todasRotas, podeAvancarPara: [...ROLE_PODE_AVANCAR['ADMIN']] }
  }

  // Verifica permissão individual primeiro
  const permUsuario = await prisma.permissaoUsuario.findUnique({ where: { usuarioId } })
  if (permUsuario) {
    return {
      rotasPermitidas: permUsuario.rotasPermitidas,
      podeAvancarPara: permUsuario.podeAvancarPara as StatusPedido[],
    }
  }

  // Fallback para permissão do role
  const rows = await fetchPermissaoRows()
  if (rows.length === 0) {
    return { rotasPermitidas: [...ROTAS_PADRÃO[role]], podeAvancarPara: [...ROLE_PODE_AVANCAR[role]] }
  }
  const row = rows.find((r) => r.role === role)
  return {
    rotasPermitidas: row ? row.rotasPermitidas : [...ROTAS_PADRÃO[role]],
    podeAvancarPara: row ? (row.podeAvancarPara as StatusPedido[]) : [...ROLE_PODE_AVANCAR[role]],
  }
}

// Busca rotas permitidas para um role específico (usado pelo navbar e middleware)
export async function getRotasPermitidasRole(role: Role, usuarioId?: string): Promise<string[]> {
  if (usuarioId) {
    const { rotasPermitidas } = await getPermissoesUsuario(usuarioId, role)
    return rotasPermitidas
  }
  if (role === 'ADMIN') return ROTAS_CONFIGURÁVEIS.map((r) => r.href)
  const rows = await fetchPermissaoRows()
  if (rows.length === 0) return [...ROTAS_PADRÃO[role]]
  const row = rows.find((r) => r.role === role)
  return row ? row.rotasPermitidas : [...ROTAS_PADRÃO[role]]
}
