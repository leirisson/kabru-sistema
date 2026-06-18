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
      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Avançando...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          {label}
        </>
      )}
    </button>
  )
}
