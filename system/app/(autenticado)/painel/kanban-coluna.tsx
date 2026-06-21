import type { SlaStatus } from '@/lib/sla'
import type { Role, StatusPedido } from '@prisma/client'
import { LABEL_STATUS } from '@/lib/status-constants'
import { PedidoCard } from './pedido-card'

const STATUS_COLORS: Record<StatusPedido, string> = {
  AGUARDANDO_SEPARACAO: 'from-yellow-500 to-amber-600',
  SEPARACAO: 'from-blue-500 to-indigo-600',
  CONFERENCIA: 'from-purple-500 to-violet-600',
  CONFERIDO: 'from-cyan-500 to-blue-600',
  FATURAMENTO: 'from-emerald-500 to-teal-600',
  SEPARACAO_DESTINATARIO: 'from-orange-500 to-red-600',
  CONCLUIDO: 'from-green-500 to-emerald-600',
}

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

type Props = {
  status: StatusPedido
  pedidos: PedidoComSla[]
  userRole: Role
  podeAvancarPara: StatusPedido[]
}

export function KanbanColuna({ status, pedidos, userRole, podeAvancarPara }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-700">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${STATUS_COLORS[status]}`} />
          <span className="text-sm font-bold text-slate-700 uppercase tracking-wide dark:text-slate-200">
            {LABEL_STATUS[status]}
          </span>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm border border-slate-200 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-200">
          {pedidos.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto min-h-[200px]">
        {pedidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
            <svg className="h-10 w-10 text-slate-300 mb-2 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-slate-400 font-medium dark:text-slate-500">Nenhum pedido</p>
          </div>
        ) : (
          pedidos.map((p) => (
            <PedidoCard
              key={p.id}
              pedido={p}
              slaStatus={p.slaStatus}
              tempoDecorrido={p.tempoDecorrido}
              userRole={userRole}
              podeAvancarPara={podeAvancarPara}
            />
          ))
        )}
      </div>
    </div>
  )
}
