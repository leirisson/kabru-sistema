import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import { STATUS_KANBAN, LABEL_STATUS } from '@/lib/status-flow'
import type { StatusPedido } from '@prisma/client'

const STATUS_COLORS: Record<StatusPedido, string> = {
  AGUARDANDO_SEPARACAO: 'from-yellow-500 to-amber-500',
  SEPARACAO: 'from-blue-500 to-indigo-500',
  CONFERENCIA: 'from-purple-500 to-violet-500',
  CONFERIDO: 'from-emerald-500 to-teal-500',
  FATURAMENTO: 'from-orange-500 to-red-500',
  SEPARACAO_DESTINATARIO: 'from-pink-500 to-rose-500',
  CONCLUIDO: 'from-green-500 to-emerald-500',
}

export const metadata = { title: 'Dashboard — Kabru Sistema' }

export default async function DashboardPage() {
  const session = await verifySession()

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const [pedidos, slaConfigs, concluidosHoje, totalPedidos, ultimosPedidos] = await Promise.all([
    prisma.pedido.findMany({
      where: { statusAtual: { not: 'CONCLUIDO' } },
      include: { cliente: true, vendedor: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.slaConfig.findMany(),
    prisma.pedido.count({
      where: {
        statusAtual: 'CONCLUIDO',
        historico: { some: { status: 'CONCLUIDO', criadoEm: { gte: hoje } } },
      },
    }),
    prisma.pedido.count(),
    prisma.pedido.findMany({
      take: 5,
      include: { cliente: true, vendedor: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const statusCounts = STATUS_KANBAN.reduce(
    (acc, status) => {
      acc[status] = pedidos.filter(p => p.statusAtual === status).length
      return acc
    },
    {} as Record<StatusPedido, number>
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001 1v4a1 1 0 001 1h2a1 1 0 001-1v-4a1 1 0 01-1-1h-2a1 1 0 01-1 1v4a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500">Visão geral do sistema</p>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="group rounded-3xl bg-white p-7 shadow-sm border border-slate-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500">Em Andamento</h3>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-bold text-slate-900">{pedidos.length}</p>
        </div>

        <div className="group rounded-3xl bg-white p-7 shadow-sm border border-slate-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500">Concluídos Hoje</h3>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-bold text-slate-900">{concluidosHoje}</p>
        </div>

        <div className="group rounded-3xl bg-white p-7 shadow-sm border border-slate-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500">Total de Pedidos</h3>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-bold text-slate-900">{totalPedidos}</p>
        </div>

        <div className="group rounded-3xl bg-white p-7 shadow-sm border border-slate-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500">Status Distintos</h3>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2m4-3a1 1 0 01-1 1H9a1 1 0 01-1-1v-4a1 1 0 011-1h4a1 1 0 011 1v4z" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-bold text-slate-900">{STATUS_KANBAN.length}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Status Cards */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2m4-3a1 1 0 01-1 1H9a1 1 0 01-1-1v-4a1 1 0 011-1h4a1 1 0 011 1v4z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-900">Pedidos por Status</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {STATUS_KANBAN.map((status) => (
                <div key={status} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`h-3 w-3 rounded-full bg-gradient-to-r ${STATUS_COLORS[status]}`} />
                    <span className="text-sm font-semibold text-slate-700">{LABEL_STATUS[status]}</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{statusCounts[status]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Últimos Pedidos */}
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Últimos Pedidos</h2>
          </div>
          <div className="space-y-4">
            {ultimosPedidos.map((pedido) => (
              <div key={pedido.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-r ${STATUS_COLORS[pedido.statusAtual]} flex items-center justify-center text-white font-bold text-sm`}>
                  {pedido.numero}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{pedido.cliente.nomeFantasia || pedido.cliente.razaoSocial}</p>
                  <p className="text-xs text-slate-500">{pedido.vendedor.nome}</p>
                </div>
                <span className="text-xs font-semibold text-slate-700">
                  {Number(pedido.valorTotal).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
