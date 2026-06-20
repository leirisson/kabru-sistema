import type { Role, StatusPedido } from '@prisma/client'
import { prisma } from '@/lib/prisma'
export { LABEL_STATUS, STATUS_KANBAN } from '@/lib/status-constants'

export const NEXT_STATUS: Record<string, StatusPedido | null> = {
  AGUARDANDO_SEPARACAO:   'SEPARACAO',
  SEPARACAO:              'CONFERENCIA',
  CONFERENCIA:            'CONFERIDO',
  CONFERIDO:              'FATURAMENTO',
  FATURAMENTO:            'SEPARACAO_DESTINATARIO',
  SEPARACAO_DESTINATARIO: 'CONCLUIDO',
  CONCLUIDO:              null,
}

export const ROLE_PODE_AVANCAR: Record<Role, StatusPedido[]> = {
  ADMIN:        ['SEPARACAO', 'CONFERENCIA', 'CONFERIDO', 'FATURAMENTO', 'SEPARACAO_DESTINATARIO', 'CONCLUIDO'],
  ESTOQUE:      ['SEPARACAO', 'CONFERENCIA', 'CONFERIDO', 'FATURAMENTO', 'SEPARACAO_DESTINATARIO', 'CONCLUIDO'],
  CONFERENCIA:  ['SEPARACAO', 'CONFERENCIA', 'CONFERIDO', 'FATURAMENTO', 'SEPARACAO_DESTINATARIO', 'CONCLUIDO'],
  FATURAMENTO:  ['SEPARACAO_DESTINATARIO'],
  EXPEDICAO:    ['SEPARACAO_DESTINATARIO', 'CONCLUIDO'],
  VENDEDOR:     [],
}

// Busca permissões do banco, com fallback para o mapa estático
export async function getPermissoesRoles(): Promise<Record<Role, StatusPedido[]>> {
  const rows = await prisma.permissaoRole.findMany()
  if (rows.length === 0) return ROLE_PODE_AVANCAR
  const result = { ...ROLE_PODE_AVANCAR }
  for (const row of rows) {
    result[row.role] = row.podeAvancarPara as StatusPedido[]
  }
  return result
}
