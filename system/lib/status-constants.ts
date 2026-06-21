import type { StatusPedido } from '@prisma/client'

export const ROTAS_CONFIGURÁVEIS = [
  { href: '/dashboard',        label: 'Dashboard' },
  { href: '/painel',           label: 'Kanban' },
  { href: '/pedidos',          label: 'Todos Pedidos' },
  { href: '/financeiro',       label: 'Financeiro' },
  { href: '/pedidos/importar', label: 'Importar PDF' },
] as const

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

export const NEXT_STATUS: Record<string, StatusPedido | null> = {
  AGUARDANDO_SEPARACAO:   'SEPARACAO',
  SEPARACAO:              'CONFERENCIA',
  CONFERENCIA:            'CONFERIDO',
  CONFERIDO:              'FATURAMENTO',
  FATURAMENTO:            'SEPARACAO_DESTINATARIO',
  SEPARACAO_DESTINATARIO: 'CONCLUIDO',
  CONCLUIDO:              null,
}
