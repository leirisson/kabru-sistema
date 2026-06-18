'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function PainelPoller({ intervaloMs }: { intervaloMs: number }) {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervaloMs)
    return () => clearInterval(id)
  }, [router, intervaloMs])

  return null
}
