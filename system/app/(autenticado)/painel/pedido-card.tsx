import Link from 'next/link'
import type { SlaStatus } from '@/lib/sla'
import type { Role, StatusPedido } from '@prisma/client'
import { NEXT_STATUS, ROLE_PODE_AVANCAR, LABEL_STATUS } from '@/lib/status-flow'
import { AvancarStatusButton } from './avancar-status-button'

const COR_SLA: Record<SlaStatus, string> = {
  verde:    'bg-green-100 text-green-800',
  amarelo:  'bg-yellow-100 text-yellow-800',
  vermelho: 'bg-red-100 text-red-800',
}

type Props = {
  pedido: {
    id: string
    numero: number
    statusAtual: StatusPedido
    valorTotal: string | number
    cliente: { nomeFantasia: string | null; razaoSocial: string }
    vendedor: { nome: string }
  }
  slaStatus: SlaStatus
  tempoDecorrido: string
  userRole: Role
}

export function PedidoCard({ pedido, slaStatus, tempoDecorrido, userRole }: Props) {
  const proximoStatus = NEXT_STATUS[pedido.statusAtual] as StatusPedido | null
  const podeAvancar = proximoStatus ? ROLE_PODE_AVANCAR[userRole].includes(proximoStatus) : false

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/painel/${pedido.id}`}
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          #{pedido.numero}
        </Link>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COR_SLA[slaStatus]}`}>
          {tempoDecorrido}
        </span>
      </div>

      <p className="text-sm font-medium text-gray-900 leading-tight">
        {pedido.cliente.nomeFantasia ?? pedido.cliente.razaoSocial}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{pedido.vendedor.nome}</span>
        <span className="font-medium text-gray-700">
          {Number(pedido.valorTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      </div>

      {podeAvancar && proximoStatus && (
        <AvancarStatusButton
          pedidoId={pedido.id}
          label={LABEL_STATUS[proximoStatus]}
        />
      )}
    </div>
  )
}
