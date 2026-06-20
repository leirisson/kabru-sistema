'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { CHAVE_VOLUME, CHAVE_ONDA, CHAVE_MUDO, type TipoOnda } from '@/app/(autenticado)/admin/sla/som-config'

function tocarAlerta() {
  try {
    if (localStorage.getItem(CHAVE_MUDO) === 'true') return

    const volume = Number(localStorage.getItem(CHAVE_VOLUME) ?? 1.5)
    const onda = (localStorage.getItem(CHAVE_ONDA) ?? 'sine') as TipoOnda

    const ctx = new AudioContext()
    // Campainha de casa: ding-dong — dois tons com ressonância longa
    const notas = [
      { freq: 783.99, inicio: 0 },     // Sol5 — "ding"
      { freq: 523.25, inicio: 0.55 },  // Dó5 — "dong"
    ]

    notas.forEach(({ freq, inicio }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = onda
      osc.frequency.value = freq

      const t = ctx.currentTime + inicio
      // ataque suave, decaimento longo como sino
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(volume, t + 0.06)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4)

      osc.start(t)
      osc.stop(t + 1.2)
    })
  } catch {
    // AudioContext pode ser bloqueado antes de interação do usuário — ignora silenciosamente
  }
}

export function PainelPoller({ intervaloMs }: { intervaloMs: number }) {
  const router = useRouter()

  useEffect(() => {
    const es = new EventSource('/api/painel-events')

    es.onmessage = () => {
      router.refresh()
      tocarAlerta()
    }

    // fallback polling caso a conexão SSE caia
    const id = setInterval(() => router.refresh(), intervaloMs)

    return () => {
      es.close()
      clearInterval(id)
    }
  }, [router, intervaloMs])

  return null
}
