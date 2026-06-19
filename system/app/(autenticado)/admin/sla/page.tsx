import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import { STATUS_KANBAN, LABEL_STATUS } from '@/lib/status-flow'
import { SlaForm } from './sla-form'
import type { StatusPedido } from '@prisma/client'

const STATUS_COLORS: Record<StatusPedido, string> = {
  AGUARDANDO_SEPARACAO: 'bg-gradient-to-r from-yellow-500 to-amber-500',
  SEPARACAO: 'bg-gradient-to-r from-blue-500 to-indigo-500',
  CONFERENCIA: 'bg-gradient-to-r from-purple-500 to-violet-500',
  CONFERIDO: 'bg-gradient-to-r from-emerald-500 to-teal-500',
  FATURAMENTO: 'bg-gradient-to-r from-orange-500 to-red-500',
  SEPARACAO_DESTINATARIO: 'bg-gradient-to-r from-pink-500 to-rose-500',
  CONCLUIDO: 'bg-gradient-to-r from-green-500 to-emerald-500',
}

export const metadata = { title: 'Configuração de SLA — Kabru Sistema' }

export default async function SlaPage() {
  const session = await verifySession()
  if (session.role !== 'ADMIN') redirect('/painel')

  const slaConfigs = await prisma.slaConfig.findMany()
  const slaMap = Object.fromEntries(slaConfigs.map((c) => [c.status, c]))

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Configuração de SLA</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Defina os tempos de alerta e crítico por status</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {STATUS_KANBAN.map((status) => {
          const config = slaMap[status]
          return (
            <div key={status} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md transition-all dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${STATUS_COLORS[status]} text-white shadow-lg`}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{LABEL_STATUS[status]}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Configurações</p>
                </div>
              </div>
              <SlaForm
                status={status}
                avisoMinutos={config?.avisoMinutos ?? 30}
                criticoMinutos={config?.criticoMinutos ?? 60}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
