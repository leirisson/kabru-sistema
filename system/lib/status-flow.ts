import type { Role, StatusPedido } from '@prisma/client'

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
  ESTOQUE:      ['SEPARACAO'],
  CONFERENCIA:  ['CONFERENCIA', 'CONFERIDO'],
  FATURAMENTO:  ['FATURAMENTO'],
  EXPEDICAO:    ['SEPARACAO_DESTINATARIO', 'CONCLUIDO'],
  VENDEDOR:     [],
}

export const LABEL_STATUS: Record<StatusPedido, string> = {
  AGUARDANDO_SEPARACAO:   'Aguardando Separação',
  SEPARACAO:              'Separação',
  CONFERENCIA:            'Conferência',
  CONFERIDO:              'Conferido',
  FATURAMENTO:            'Faturamento',
  SEPARACAO_DESTINATARIO: 'Sep. Destinatário',
  CONCLUIDO:              'Concluído',
}

export const STATUS_KANBAN: StatusPedido[] = [
  'AGUARDANDO_SEPARACAO',
  'SEPARACAO',
  'CONFERENCIA',
  'CONFERIDO',
  'FATURAMENTO',
  'SEPARACAO_DESTINATARIO',
]
