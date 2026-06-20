import Link from 'next/link'
import type { SlaStatus } from '@/lib/sla'
import type { Role, StatusPedido } from '@prisma/client'
import { NEXT_STATUS, LABEL_STATUS } from '@/lib/status-flow'
import { AvancarStatusButton } from './avancar-status-button'

const COR_SLA: Record<SlaStatus, string> = {
  verde:    'bg-emerald-100 text-emerald-800 border-emerald-200',
  amarelo:  'bg-amber-100 text-amber-800 border-amber-200',
  vermelho: 'bg-red-100 text-red-800 border-red-200',
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
  podeAvancarPara: StatusPedido[]
}

export function PedidoCard({ pedido, slaStatus, tempoDecorrido, userRole, podeAvancarPara }: Props) {
  const proximoStatus = NEXT_STATUS[pedido.statusAtual] as StatusPedido | null
  const podeAvancar = proximoStatus ? podeAvancarPara.includes(proximoStatus) : false

  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/painel/${pedido.id}`}
          className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors dark:text-slate-100 dark:group-hover:text-indigo-400"
        >
          #{pedido.numero}
        </Link>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${COR_SLA[slaStatus]}`}>
          {slaStatus === 'vermelho' && (
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          {tempoDecorrido}
        </span>
      </div>

      <p className="text-sm font-semibold text-slate-800 leading-tight dark:text-slate-200">
        {pedido.cliente.nomeFantasia ?? pedido.cliente.razaoSocial}
      </p>

      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="font-medium">{pedido.vendedor.nome}</span>
        </div>
        <span className="font-bold text-slate-900 dark:text-slate-100">
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
