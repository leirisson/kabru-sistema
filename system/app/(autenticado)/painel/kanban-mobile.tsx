'use client'

import { useState } from 'react'
import { LABEL_STATUS } from '@/lib/status-constants'
import type { Role, StatusPedido } from '@prisma/client'
import { KanbanColuna } from './kanban-coluna'
import type { SlaStatus } from '@/lib/sla'

type PedidoComSla = {
  id: string
  numero: number
  statusAtual: StatusPedido
  valorTotal: string | number
  cliente: { nomeFantasia: string | null; razaoSocial: string }
  vendedor: { nome: string }
  slaStatus: SlaStatus
  tempoDecorrido: string
}

type Coluna = {
  status: StatusPedido
  pedidos: PedidoComSla[]
}

type Props = {
  colunas: Coluna[]
  userRole: Role
  podeAvancarPara: StatusPedido[]
}

const STATUS_DOT: Record<StatusPedido, string> = {
  AGUARDANDO_SEPARACAO: 'bg-amber-500',
  SEPARACAO: 'bg-blue-500',
  CONFERENCIA: 'bg-violet-500',
  CONFERIDO: 'bg-cyan-500',
  FATURAMENTO: 'bg-emerald-500',
  SEPARACAO_DESTINATARIO: 'bg-orange-500',
  CONCLUIDO: 'bg-green-500',
}

export function KanbanMobile({ colunas, userRole, podeAvancarPara }: Props) {
  const [abaAtiva, setAbaAtiva] = useState<StatusPedido>(colunas[0].status)

  const colunaAtiva = colunas.find((c) => c.status === abaAtiva)!

  return (
    <div>
      {/* Seletor de status — scroll horizontal */}
      <div className="overflow-x-auto -mx-3 px-3 mb-4">
        <div className="flex gap-2 min-w-max">
          {colunas.map(({ status, pedidos }) => (
            <button
              key={status}
              onClick={() => setAbaAtiva(status)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all border ${
                abaAtiva === status
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
              {LABEL_STATUS[status]}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                abaAtiva === status
                  ? 'bg-white/20 text-white dark:bg-black/20 dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              }`}>
                {pedidos.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Coluna ativa */}
      <KanbanColuna
        status={colunaAtiva.status}
        pedidos={colunaAtiva.pedidos}
        userRole={userRole}
        podeAvancarPara={podeAvancarPara}
      />
    </div>
  )
}
