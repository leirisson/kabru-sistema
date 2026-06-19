'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-slate-300">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="senha" className="text-sm font-medium text-gray-700 dark:text-slate-300">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
      </div>

      {state?.erro && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">{state.erro}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-slate-200"
      >
        {pending ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}
