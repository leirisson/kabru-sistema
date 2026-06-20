import type { StatusPedido } from '@prisma/client'

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
