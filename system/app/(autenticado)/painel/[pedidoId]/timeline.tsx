import type { StatusPedido } from '@prisma/client'
import { LABEL_STATUS } from '@/lib/status-flow'

type Entrada = {
  id: string
  status: StatusPedido
  criadoEm: Date
  observacao: string | null
  usuario: { nome: string; role: string }
}

export function Timeline({ historico }: { historico: Entrada[] }) {
  return (
    <ol className="relative border-l border-gray-200">
      {historico.map((h, i) => (
        <li key={h.id} className="mb-6 ml-4">
          <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-blue-500" />
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-gray-900">{LABEL_STATUS[h.status]}</span>
            {i === 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                atual
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {h.usuario.nome} &middot;{' '}
            {new Date(h.criadoEm).toLocaleString('pt-BR', {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </p>
          {h.observacao && <p className="mt-1 text-sm text-gray-600">{h.observacao}</p>}
        </li>
      ))}
    </ol>
  )
}
