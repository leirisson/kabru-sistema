'use client'

import { useActionState } from 'react'
import { atualizarPermissaoRole } from '@/app/actions/admin'
import { LABEL_STATUS, STATUS_KANBAN } from '@/lib/status-constants'
import type { Role, StatusPedido } from '@prisma/client'

const LABEL_ROLE: Record<Role, string> = {
  ADMIN:       'Admin',
  VENDEDOR:    'Vendedor',
  ESTOQUE:     'Estoque',
  CONFERENCIA: 'Conferência',
  FATURAMENTO: 'Faturamento',
  EXPEDICAO:   'Expedição',
}

const COR_ROLE: Record<Role, string> = {
  ADMIN:       'from-yellow-500 to-amber-500',
  VENDEDOR:    'from-blue-500 to-indigo-500',
  ESTOQUE:     'from-emerald-500 to-teal-500',
  CONFERENCIA: 'from-purple-500 to-violet-500',
  FATURAMENTO: 'from-orange-500 to-red-500',
  EXPEDICAO:   'from-pink-500 to-rose-500',
}

// Todos os status possíveis como próximo (avançar para)
const TODOS_STATUS: StatusPedido[] = [
  'SEPARACAO',
  'CONFERENCIA',
  'CONFERIDO',
  'FATURAMENTO',
  'SEPARACAO_DESTINATARIO',
  'CONCLUIDO',
]

type Props = {
  role: Role
  podeAvancarPara: string[]
}

export function PermissaoForm({ role, podeAvancarPara }: Props) {
  const [state, action, pending] = useActionState(atualizarPermissaoRole, null)

  if (role === 'ADMIN') return null // ADMIN sempre tem tudo

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-3 mb-5">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${COR_ROLE[role]} text-white shadow-md`}>
          <span className="text-sm font-bold">{LABEL_ROLE[role][0]}</span>
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{LABEL_ROLE[role]}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Pode avançar pedido para:</p>
        </div>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="role" value={role} />

        <div className="grid grid-cols-2 gap-2">
          {TODOS_STATUS.map((status) => {
            const marcado = podeAvancarPara.includes(status)
            return (
              <label
                key={status}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                  marcado
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400'
                }`}
              >
                <input
                  type="checkbox"
                  name="podeAvancarPara"
                  value={status}
                  defaultChecked={marcado}
                  className="h-4 w-4 rounded accent-indigo-600"
                />
                {LABEL_STATUS[status]}
              </label>
            )
          })}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-slate-200 transition-all"
          >
            {pending ? 'Salvando...' : 'Salvar'}
          </button>
          {state?.ok && <span className="text-xs text-emerald-600 dark:text-emerald-400">Salvo!</span>}
          {state?.erro && <span className="text-xs text-red-600 dark:text-red-400">{state.erro}</span>}
        </div>
      </form>
    </div>
  )
}
