import type { SlaStatus } from '@/lib/sla'
import type { Role, StatusPedido } from '@prisma/client'
import { LABEL_STATUS } from '@/lib/status-flow'
import { PedidoCard } from './pedido-card'

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
}

export function KanbanColuna({ status, pedidos, userRole }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between rounded-t-md bg-gray-100 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
          {LABEL_STATUS[status]}
        </span>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
          {pedidos.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto">
        {pedidos.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-400">Nenhum pedido</p>
        ) : (
          pedidos.map((p) => (
            <PedidoCard
              key={p.id}
              pedido={p}
              slaStatus={p.slaStatus}
              tempoDecorrido={p.tempoDecorrido}
              userRole={userRole}
            />
          ))
        )}
      </div>
    </div>
  )
}
