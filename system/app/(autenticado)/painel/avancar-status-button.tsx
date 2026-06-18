'use client'

import { useTransition } from 'react'
import { avancarStatus } from '@/app/actions/pedidos'

type Props = {
  pedidoId: string
  label: string
}

export function AvancarStatusButton({ pedidoId, label }: Props) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await avancarStatus(pedidoId)
      if (result.erro) alert(result.erro)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="w-full rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {pending ? 'Avançando...' : `→ ${label}`}
    </button>
  )
}
