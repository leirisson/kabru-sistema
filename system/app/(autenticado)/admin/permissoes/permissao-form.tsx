'use client'

import { useActionState, useState, useEffect, useTransition } from 'react'
import { atualizarPermissaoRole } from '@/app/actions/admin'
import { ROTAS_CONFIGURÁVEIS } from '@/lib/status-constants'
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

const TODOS_STATUS: { status: StatusPedido; de: string; para: string }[] = [
  { status: 'SEPARACAO',              de: 'Ag. Separação',   para: 'Separação' },
  { status: 'CONFERENCIA',            de: 'Separação',       para: 'Conferência' },
  { status: 'CONFERIDO',              de: 'Conferência',     para: 'Conferido' },
  { status: 'FATURAMENTO',            de: 'Conferido',       para: 'Faturamento' },
  { status: 'SEPARACAO_DESTINATARIO', de: 'Faturamento',     para: 'Sep. Destinatário' },
  { status: 'CONCLUIDO',              de: 'Sep. Destinatário', para: 'Concluído' },
]

type Props = {
  role: Role
  podeAvancarPara: string[]
  rotasPermitidas: string[]
}

export function PermissaoForm({ role, podeAvancarPara, rotasPermitidas }: Props) {
  const [state, formAction] = useActionState(atualizarPermissaoRole, null)
  const [isPending, startTransition] = useTransition()
  const [statusSel, setStatusSel] = useState<StatusPedido[]>((podeAvancarPara ?? []) as StatusPedido[])
  const [rotasSel, setRotasSel] = useState<string[]>(rotasPermitidas ?? [])

  useEffect(() => { setStatusSel((podeAvancarPara ?? []) as StatusPedido[]) }, [podeAvancarPara])
  useEffect(() => { setRotasSel(rotasPermitidas ?? []) }, [rotasPermitidas])

  if (role === 'ADMIN') return null

  function toggleStatus(status: StatusPedido) {
    setStatusSel((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
  }

  function toggleRota(href: string) {
    setRotasSel((prev) =>
      prev.includes(href) ? prev.filter((r) => r !== href) : [...prev, href]
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData()
    formData.set('role', role)
    statusSel.forEach((s) => formData.append('podeAvancarPara', s))
    rotasSel.forEach((r) => formData.append('rotasPermitidas', r))
    startTransition(() => { formAction(formData) })
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-700">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${COR_ROLE[role]} text-white shadow-md shrink-0`}>
          <span className="text-sm font-bold">{LABEL_ROLE[role][0]}</span>
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{LABEL_ROLE[role]}</h3>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">

        {/* Seção: Rotas */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            Páginas acessíveis
          </p>
          <div className="flex flex-col gap-2">
            {ROTAS_CONFIGURÁVEIS.map(({ href, label }) => {
              const marcado = rotasSel.includes(href)
              return (
                <label
                  key={href}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                    marcado
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    name="rotasPermitidas"
                    value={href}
                    checked={marcado}
                    onChange={() => toggleRota(href)}
                    className="h-4 w-4 rounded accent-emerald-600"
                  />
                  {label}
                </label>
              )
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 dark:border-slate-700" />

        {/* Seção: Status do Kanban */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            Pode avançar pedido para
          </p>
          <div className="grid grid-cols-2 gap-2">
            {TODOS_STATUS.map(({ status, de, para }) => {
              const marcado = statusSel.includes(status)
              return (
                <label
                  key={status}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                    marcado
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    name="podeAvancarPara"
                    value={status}
                    checked={marcado}
                    onChange={() => toggleStatus(status)}
                    className="mt-0.5 h-4 w-4 rounded accent-indigo-600 shrink-0"
                  />
                  <div className="leading-tight">
                    <span className="block">{para}</span>
                    <span className="block font-normal opacity-60">{de} →</span>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-slate-200 transition-all"
          >
            {isPending ? 'Salvando...' : 'Salvar'}
          </button>
          {state?.ok && <span className="text-xs text-emerald-600 dark:text-emerald-400">Salvo!</span>}
          {state?.erro && <span className="text-xs text-red-600 dark:text-red-400">{state.erro}</span>}
        </div>
      </form>
    </div>
  )
}
