import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import { STATUS_KANBAN } from '@/lib/status-flow'
import { SlaForm } from './sla-form'

export const metadata = { title: 'Configuração de SLA — Kabru Sistema' }

export default async function SlaPage() {
  const session = await verifySession()
  if (session.role !== 'ADMIN') redirect('/painel')

  const slaConfigs = await prisma.slaConfig.findMany()
  const slaMap = Object.fromEntries(slaConfigs.map((c) => [c.status, c]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Configuração de SLA</h1>
        <p className="mt-1 text-sm text-gray-500">
          Defina os tempos de alerta (amarelo) e crítico (vermelho) por status.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
        {STATUS_KANBAN.map((status) => {
          const cfg = slaMap[status]
          return (
            <div key={status} className="px-4 py-4">
              <SlaForm
                status={status}
                avisoMinutos={cfg?.avisoMinutos ?? 30}
                criticoMinutos={cfg?.criticoMinutos ?? 60}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
