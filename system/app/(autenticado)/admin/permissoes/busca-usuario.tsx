'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Role } from '@prisma/client'

const LABEL_ROLE: Record<Role, string> = {
  ADMIN: 'Admin',
  VENDEDOR: 'Vendedor',
  ESTOQUE: 'Estoque',
  CONFERENCIA: 'Conferência',
  FATURAMENTO: 'Faturamento',
  EXPEDICAO: 'Expedição',
}

const COR_ROLE: Record<Role, string> = {
  ADMIN:       'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  VENDEDOR:    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  ESTOQUE:     'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  CONFERENCIA: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  FATURAMENTO: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  EXPEDICAO:   'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
}

type Usuario = { id: string; nome: string; role: Role }

type Props = {
  usuarios: Usuario[]
  usuarioSelecionadoId?: string
}

export function BuscaUsuario({ usuarios, usuarioSelecionadoId }: Props) {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)

  const filtrados = busca.trim().length > 0
    ? usuarios.filter((u) => u.nome.toLowerCase().includes(busca.toLowerCase()))
    : []

  const selecionado = usuarios.find((u) => u.id === usuarioSelecionadoId)

  function selecionar(id: string) {
    setBusca('')
    setAberto(false)
    router.push(`/admin/permissoes?usuarioId=${id}`)
  }

  function limpar() {
    setBusca('')
    setAberto(false)
    router.push('/admin/permissoes')
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
        Personalizar permissões de um usuário específico
      </p>

      <div className="flex gap-3 items-start flex-wrap">
        {/* Campo de busca */}
        <div className="relative flex-1 min-w-[220px]">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-700">
            <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar usuário por nome..."
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setAberto(true) }}
              onFocus={() => setAberto(true)}
              className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none dark:text-slate-100"
            />
            {busca && (
              <button onClick={() => setBusca('')} className="text-slate-400 hover:text-slate-600">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Dropdown de resultados */}
          {aberto && filtrados.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800 overflow-hidden">
              {filtrados.map((u) => (
                <button
                  key={u.id}
                  onClick={() => selecionar(u.id)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100">{u.nome}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COR_ROLE[u.role]}`}>
                    {LABEL_ROLE[u.role]}
                  </span>
                </button>
              ))}
            </div>
          )}
          {aberto && busca.trim().length > 0 && filtrados.length === 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
              Nenhum usuário encontrado
            </div>
          )}
        </div>

        {/* Usuário selecionado */}
        {selecionado && (
          <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 dark:border-indigo-700 dark:bg-indigo-900/30">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
              {selecionado.nome.charAt(0).toUpperCase()}
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">{selecionado.nome}</p>
              <span className="text-xs text-indigo-600 dark:text-indigo-400">{LABEL_ROLE[selecionado.role]}</span>
            </div>
            <button
              onClick={limpar}
              className="ml-2 text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200"
              title="Remover seleção"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
