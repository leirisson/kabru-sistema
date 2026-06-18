'use client'

import { useActionState } from 'react'
import { atualizarSla } from '@/app/actions/admin'
import type { StatusPedido } from '@prisma/client'
import { LABEL_STATUS } from '@/lib/status-flow'

type Props = {
  status: StatusPedido
  avisoMinutos: number
  criticoMinutos: number
}

export function SlaForm({ status, avisoMinutos, criticoMinutos }: Props) {
  const [state, action, pending] = useActionState(atualizarSla, null)

  return (
    <form action={action} className="flex items-end gap-3">
      <input type="hidden" name="status" value={status} />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Status</label>
        <span className="text-sm text-gray-900">{LABEL_STATUS[status]}</span>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-yellow-700">Aviso (min)</label>
        <input
          name="avisoMinutos"
          type="number"
          defaultValue={avisoMinutos}
          min={1}
          required
          className="w-20 rounded border border-yellow-300 bg-yellow-50 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-red-700">Crítico (min)</label>
        <input
          name="criticoMinutos"
          type="number"
          defaultValue={criticoMinutos}
          min={1}
          required
          className="w-20 rounded border border-red-300 bg-red-50 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-gray-800 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? '...' : 'Salvar'}
      </button>

      {state?.ok && <span className="text-xs text-green-600">Salvo!</span>}
      {state?.erro && <span className="text-xs text-red-600">{state.erro}</span>}
    </form>
  )
}
