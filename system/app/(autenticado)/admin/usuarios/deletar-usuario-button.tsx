'use client'

import { useTransition } from 'react'
import { deletarUsuario } from '@/app/actions/admin'

export function DeletarUsuarioButton({ id, nome }: { id: string; nome: string }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm(`Excluir ${nome}?`)) return
    startTransition(async () => {
      await deletarUsuario(id)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
    >
      {pending ? '...' : 'Excluir'}
    </button>
  )
}
