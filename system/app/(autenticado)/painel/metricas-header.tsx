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
    <div className="mb-4 grid grid-cols-3 gap-3">
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
        <p className="text-xs text-gray-500">Em andamento</p>
        <p className="text-2xl font-bold text-gray-900">{emAndamento}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
        <p className="text-xs text-gray-500">Concluídos hoje</p>
        <p className="text-2xl font-bold text-gray-900">{concluidosHoje}</p>
      </div>
      <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
        <p className="text-xs text-red-500">SLA crítico</p>
        <p className="text-2xl font-bold text-red-700">{criticos}</p>
      </div>
    </div>
  )
}
