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
    <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="group rounded-2xl bg-white p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Em andamento</p>
            <p className="text-4xl font-bold text-slate-900">{emAndamento}</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg group-hover:scale-110 transition-transform">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="group rounded-2xl bg-white p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Concluídos hoje</p>
            <p className="text-4xl font-bold text-slate-900">{concluidosHoje}</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg group-hover:scale-110 transition-transform">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className={`group rounded-2xl p-6 shadow-sm border transition-all ${criticos > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium mb-1 ${criticos > 0 ? 'text-red-600' : 'text-slate-500'}`}>SLA crítico</p>
            <p className={`text-4xl font-bold ${criticos > 0 ? 'text-red-700' : 'text-slate-900'}`}>{criticos}</p>
          </div>
          <div className={`flex h-14 w-14 items-center justify-center rounded-xl shadow-lg group-hover:scale-110 transition-transform ${criticos > 0 ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-gradient-to-br from-slate-400 to-slate-500'} text-white`}>
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
