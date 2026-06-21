import type { StatusPedido } from '@prisma/client'
import type { SlaStatus } from '@/lib/sla'

type PedidoMetrica = {
  statusAtual: StatusPedido
  slaStatus: SlaStatus
}

type Props = {
  pedidos: PedidoMetrica[]
  concluidosHoje: number
}

export function MetricasHeader({ pedidos, concluidosHoje }: Props) {
  const emAndamento = pedidos.filter((p) => p.statusAtual !== 'CONCLUIDO').length
  const criticos = pedidos.filter((p) => p.slaStatus === 'vermelho').length

  return (
    <div className="mb-6 sm:mb-8 grid grid-cols-3 gap-3 sm:gap-6">
      <div className="group rounded-2xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1 dark:text-slate-400 truncate">Em andamento</p>
            <p className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">{emAndamento}</p>
          </div>
          <div className="flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg group-hover:scale-110 transition-transform">
            <svg className="h-5 w-5 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
      </div>

      <div className="group rounded-2xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1 dark:text-slate-400 truncate">Concluídos hoje</p>
            <p className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">{concluidosHoje}</p>
          </div>
          <div className="flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg group-hover:scale-110 transition-transform">
            <svg className="h-5 w-5 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className={`group rounded-2xl p-4 sm:p-6 shadow-sm border transition-all ${criticos > 0 ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className={`text-xs sm:text-sm font-medium mb-1 truncate ${criticos > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>SLA crítico</p>
            <p className={`text-2xl sm:text-4xl font-bold ${criticos > 0 ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>{criticos}</p>
          </div>
          <div className={`flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl shadow-lg group-hover:scale-110 transition-transform ${criticos > 0 ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-gradient-to-br from-slate-400 to-slate-500'} text-white`}>
            <svg className="h-5 w-5 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
