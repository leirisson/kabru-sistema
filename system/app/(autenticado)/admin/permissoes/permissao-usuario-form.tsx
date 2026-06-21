'use client'

import { useActionState, useState, useEffect, useTransition } from 'react'
import { atualizarPermissaoUsuario, removerPermissaoUsuario } from '@/app/actions/admin'
import { ROTAS_CONFIGURÁVEIS } from '@/lib/status-constants'
import type { Role, StatusPedido } from '@prisma/client'
import { useRouter } from 'next/navigation'

const TODOS_STATUS: { status: StatusPedido; de: string; para: string }[] = [
  { status: 'SEPARACAO',              de: 'Ag. Separação',    para: 'Separação' },
  { status: 'CONFERENCIA',            de: 'Separação',        para: 'Conferência' },
  { status: 'CONFERIDO',              de: 'Conferência',      para: 'Conferido' },
  { status: 'FATURAMENTO',            de: 'Conferido',        para: 'Faturamento' },
  { status: 'SEPARACAO_DESTINATARIO', de: 'Faturamento',      para: 'Sep. Destinatário' },
  { status: 'CONCLUIDO',              de: 'Sep. Destinatário', para: 'Concluído' },
]

const LABEL_ROLE: Record<Role, string> = {
  ADMIN: 'Admin', VENDEDOR: 'Vendedor', ESTOQUE: 'Estoque',
  CONFERENCIA: 'Conferência', FATURAMENTO: 'Faturamento', EXPEDICAO: 'Expedição',
}

type Props = {
  usuarioId: string
  usuarioNome: string
  role: Role
  podeAvancarPara: StatusPedido[]
  rotasPermitidas: string[]
}

export function PermissaoUsuarioForm({ usuarioId, usuarioNome, role, podeAvancarPara, rotasPermitidas }: Props) {
  const [state, formAction] = useActionState(atualizarPermissaoUsuario, null)
  const [isPending, startTransition] = useTransition()
  const [statusSel, setStatusSel] = useState<StatusPedido[]>(podeAvancarPara)
  const [rotasSel, setRotasSel] = useState<string[]>(rotasPermitidas)
  const [removendo, setRemovendo] = useState(false)
  const router = useRouter()

  useEffect(() => { setStatusSel(podeAvancarPara) }, [podeAvancarPara])
  useEffect(() => { setRotasSel(rotasPermitidas) }, [rotasPermitidas])

  function toggleStatus(status: StatusPedido) {
    setStatusSel((prev) => prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status])
  }

  function toggleRota(href: string) {
    setRotasSel((prev) => prev.includes(href) ? prev.filter((r) => r !== href) : [...prev, href])
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData()
    formData.set('usuarioId', usuarioId)
    statusSel.forEach((s) => formData.append('podeAvancarPara', s))
    rotasSel.forEach((r) => formData.append('rotasPermitidas', r))
    startTransition(() => { formAction(formData) })
  }

  async function handleRemover() {
    setRemovendo(true)
    await removerPermissaoUsuario(usuarioId)
    setRemovendo(false)
    router.push('/admin/permissoes')
  }

  return (
    <div className="rounded-3xl border border-indigo-200 bg-white shadow-sm dark:border-indigo-800 dark:bg-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-indigo-100 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-900/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold">
            {usuarioNome.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{usuarioNome}</h3>
            <p className="text-xs text-indigo-600 dark:text-indigo-400">{LABEL_ROLE[role]} — permissão individual</p>
          </div>
        </div>
        <button
          onClick={handleRemover}
          disabled={removendo}
          title="Remover permissões individuais (volta a usar as do perfil)"
          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-all dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {removendo ? 'Removendo...' : 'Usar permissões do perfil'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">

        {/* Rotas */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            Páginas acessíveis
          </p>
          <div className="flex flex-col gap-2">
            {ROTAS_CONFIGURÁVEIS.map(({ href, label }) => {
              const marcado = rotasSel.includes(href)
              return (
                <label key={href} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                  marcado
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400'
                }`}>
                  <input type="checkbox" name="rotasPermitidas" value={href} checked={marcado}
                    onChange={() => toggleRota(href)} className="h-4 w-4 rounded accent-emerald-600" />
                  {label}
                </label>
              )
            })}
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-700" />

        {/* Status */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            Pode avançar pedido para
          </p>
          <div className="grid grid-cols-2 gap-2">
            {TODOS_STATUS.map(({ status, de, para }) => {
              const marcado = statusSel.includes(status)
              return (
                <label key={status} className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                  marcado
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400'
                }`}>
                  <input type="checkbox" name="podeAvancarPara" value={status} checked={marcado}
                    onChange={() => toggleStatus(status)} className="mt-0.5 h-4 w-4 rounded accent-indigo-600 shrink-0" />
                  <div className="leading-tight">
                    <span className="block">{para}</span>
                    <span className="block font-normal opacity-60">{de} →</span>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={isPending}
            className="rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-slate-200 transition-all">
            {isPending ? 'Salvando...' : 'Salvar permissões individuais'}
          </button>
          {state?.ok && <span className="text-xs text-emerald-600 dark:text-emerald-400">Salvo!</span>}
          {state?.erro && <span className="text-xs text-red-600 dark:text-red-400">{state.erro}</span>}
        </div>
      </form>
    </div>
  )
}
