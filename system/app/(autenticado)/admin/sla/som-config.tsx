'use client'

import { useState, useEffect } from 'react'

export type TipoOnda = 'sine' | 'square' | 'triangle' | 'sawtooth'

export const CHAVE_VOLUME = 'kabru_alerta_volume'
export const CHAVE_ONDA = 'kabru_alerta_onda'
export const CHAVE_MUDO = 'kabru_alerta_mudo'

export const LABEL_ONDA: Record<TipoOnda, string> = {
  sine:     'Senoidal — painel de banco',
  square:   'Quadrada — eletrônico/buzzer',
  triangle: 'Triangular — suave',
  sawtooth: 'Dente de serra — agressivo',
}

function tocarPreview(onda: TipoOnda, volume: number) {
  try {
    const ctx = new AudioContext()
    const notas = [
      { freq: 783.99, inicio: 0 },
      { freq: 523.25, inicio: 0.55 },
    ]
    notas.forEach(({ freq, inicio }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = onda
      osc.frequency.value = freq
      const t = ctx.currentTime + inicio
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(volume, t + 0.06)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4)
      osc.start(t)
      osc.stop(t + 1.2)
    })
  } catch {}
}

export function SomConfig() {
  const [volume, setVolume] = useState(1.5)
  const [onda, setOnda] = useState<TipoOnda>('sine')
  const [mudo, setMudo] = useState(false)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    const v = localStorage.getItem(CHAVE_VOLUME)
    const o = localStorage.getItem(CHAVE_ONDA)
    const m = localStorage.getItem(CHAVE_MUDO)
    if (v) setVolume(Number(v))
    if (o) setOnda(o as TipoOnda)
    if (m) setMudo(m === 'true')
  }, [])

  function salvar() {
    localStorage.setItem(CHAVE_VOLUME, String(volume))
    localStorage.setItem(CHAVE_ONDA, onda)
    localStorage.setItem(CHAVE_MUDO, String(mudo))
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg transition-all ${mudo ? 'bg-slate-400' : 'bg-gradient-to-br from-violet-500 to-purple-600'}`}>
            {mudo ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0a6 6 0 01-6-6m6 6a6 6 0 006-6M9 9a3 3 0 000 6" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Alerta Sonoro</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Som emitido ao avançar um status</p>
          </div>
        </div>

        {/* Toggle mudo */}
        <button
          type="button"
          onClick={() => setMudo((m) => !m)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
            mudo
              ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300'
          }`}
        >
          {mudo ? (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
              Mudo
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0a6 6 0 01-6-6m6 6a6 6 0 006-6" />
              </svg>
              Ativo
            </>
          )}
        </button>
      </div>

      <div className={`flex flex-col gap-5 transition-opacity ${mudo ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        {/* Tipo de onda */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tipo de som</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(LABEL_ONDA) as TipoOnda[]).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setOnda(tipo)}
                className={`rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all ${
                  onda === tipo
                    ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-500'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-slate-500'
                }`}
              >
                {LABEL_ONDA[tipo]}
              </button>
            ))}
          </div>
        </div>

        {/* Volume */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Volume</label>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {Math.round((volume / 2) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.1}
            max={2}
            step={0.1}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full accent-violet-600"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>Baixo</span>
            <span>Alto</span>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => tocarPreview(onda, volume)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Testar som
          </button>
          <button
            type="button"
            onClick={salvar}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-all"
          >
            {salvo ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Salvo!
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Salvar preferências
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
