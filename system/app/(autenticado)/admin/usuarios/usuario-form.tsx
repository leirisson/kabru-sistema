'use client'

import { useActionState, useState } from 'react'
import { criarUsuario, atualizarUsuario } from '@/app/actions/admin'
import type { Role } from '@prisma/client'

const ROLES: Role[] = ['ADMIN', 'VENDEDOR', 'ESTOQUE', 'CONFERENCIA', 'FATURAMENTO', 'EXPEDICAO']

const LABEL_ROLE: Record<Role, string> = {
  ADMIN: 'Admin',
  VENDEDOR: 'Vendedor',
  ESTOQUE: 'Estoque',
  CONFERENCIA: 'Conferência',
  FATURAMENTO: 'Faturamento',
  EXPEDICAO: 'Expedição',
}

type UsuarioExistente = {
  id: string
  nome: string
  email: string
  role: Role
}

type Props = {
  usuario?: UsuarioExistente
  onConcluido?: () => void
}

export function UsuarioForm({ usuario, onConcluido }: Props) {
  const action = usuario ? atualizarUsuario : criarUsuario
  const [state, formAction, pending] = useActionState(action, null)
  const [role, setRole] = useState<Role>(usuario?.role ?? 'VENDEDOR')

  if (state?.ok && onConcluido) onConcluido()

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {usuario && <input type="hidden" name="id" value={usuario.id} />}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-700 dark:text-slate-300">Nome</label>
          <input
            name="nome"
            defaultValue={usuario?.nome}
            required
            className="rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-700 dark:text-slate-300">Email</label>
          <input
            name="email"
            type="email"
            defaultValue={usuario?.email}
            required
            className="rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-700 dark:text-slate-300">
            Senha {usuario && <span className="text-gray-400 dark:text-slate-500">(deixe vazio para manter)</span>}
          </label>
          <input
            name="senha"
            type="password"
            minLength={6}
            required={!usuario}
            className="rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-700 dark:text-slate-300">Role</label>
          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {LABEL_ROLE[r]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state?.erro && (
        <p className="rounded bg-red-50 px-3 py-1.5 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">{state.erro}</p>
      )}
      {state?.ok && (
        <p className="rounded bg-green-50 px-3 py-1.5 text-sm text-green-600 dark:bg-green-900/30 dark:text-green-400">Salvo com sucesso!</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-end rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-slate-200"
      >
        {pending ? 'Salvando...' : usuario ? 'Atualizar' : 'Criar usuário'}
      </button>
    </form>
  )
}
