import { prisma } from '@/lib/prisma'
import { verifyRotaPermitida } from '@/lib/dal'
import { STATUS_KANBAN, LABEL_STATUS } from '@/lib/status-flow'
import type { StatusPedido } from '@prisma/client'

const STATUS_GRADIENTS: Record<StatusPedido, string> = {
  AGUARDANDO_SEPARACAO: 'from-[#F59E0B] to-[#FFD700]',
  SEPARACAO: 'from-[#007ACC] to-[#005B9E]',
  CONFERENCIA: 'from-[#8B5CF6] to-[#6D28D9]',
  CONFERIDO: 'from-[#10B981] to-[#059669]',
  FATURAMENTO: 'from-[#F97316] to-[#DC2626]',
  SEPARACAO_DESTINATARIO: 'from-[#EC4899] to-[#DB2777]',
  CONCLUIDO: 'from-[#22C55E] to-[#16A34A]',
}

export const metadata = { title: 'Dashboard — Kabru Sistema' }

export default async function DashboardPage() {
  const session = await verifyRotaPermitida('/dashboard')


  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const inicioSemana = new Date(hoje)
  inicioSemana.setDate(hoje.getDate() - hoje.getDay())

  const [pedidos, slaConfigs, concluidosHoje, totalPedidos, ultimosPedidos, totalConcluidos, novosHoje, novosSemana, pedidosPorVendedor] = await Promise.all([
    prisma.pedido.findMany({
      where: { statusAtual: { not: { equals: 'CONCLUIDO' } } },
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
    prisma.pedido.count({ where: { statusAtual: 'CONCLUIDO' } }),
    prisma.pedido.count({ where: { dataEmissao: { gte: hoje } } }),
    prisma.pedido.count({ where: { dataEmissao: { gte: inicioSemana } } }),
    prisma.pedido.groupBy({
      by: ['vendedorId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
  ])

  const vendedoresIds = pedidosPorVendedor.map(v => v.vendedorId)
  const vendedores = await prisma.usuario.findMany({
    where: { id: { in: vendedoresIds } },
    select: { id: true, nome: true },
  })
  const vendedorMap = Object.fromEntries(vendedores.map(v => [v.id, v.nome]))

  const taxaConclusao = totalPedidos > 0 ? Math.round((totalConcluidos / totalPedidos) * 100) : 0

  const statusCounts = STATUS_KANBAN.reduce(
    (acc, status) => {
      acc[status] = pedidos.filter(p => p.statusAtual === status).length
      return acc
    },
    {} as Record<StatusPedido, number>
  )

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#FFD700] text-[#0A0A0A] shadow-lg shrink-0">
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001 1v4a1 1 0 001 1h2a1 1 0 001-1v-4a1 1 0 01-1-1h-2a1 1 0 01-1 1v4a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-[#FFF]">Dashboard</h1>
            <p className="text-xs sm:text-sm text-slate-500">Visão geral do sistema</p>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
        <div className="group rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 p-4 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">Em Andamento</h3>
            <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#007ACC] to-[#005B9E] text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="h-4 w-4 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">{pedidos.length}</p>
        </div>

        <div className="group rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 p-4 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">Concluídos Hoje</h3>
            <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="h-4 w-4 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">{concluidosHoje}</p>
        </div>

        <div className="group rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 p-4 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">Total de Pedidos</h3>
            <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-[#FFD700] text-[#0A0A0A] shadow-lg group-hover:scale-110 transition-transform">
              <svg className="h-4 w-4 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">{totalPedidos}</p>
        </div>

        <div className="group rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 p-4 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">Taxa de Conclusão</h3>
            <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="h-4 w-4 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">{taxaConclusao}%</p>
          <p className="text-xs text-slate-400 mt-1">{totalConcluidos} de {totalPedidos} pedidos</p>
        </div>
      </div>

      {/* Novos Pedidos */}
      <div className="grid gap-3 sm:gap-6 sm:grid-cols-2">
        <div className="group rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 p-4 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">Novos Pedidos Hoje</h3>
            <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="h-4 w-4 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">{novosHoje}</p>
          <p className="text-xs text-slate-400 mt-1">emitidos hoje</p>
        </div>

        <div className="group rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 p-4 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">Novos Pedidos na Semana</h3>
            <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="h-4 w-4 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">{novosSemana}</p>
          <p className="text-xs text-slate-400 mt-1">desde domingo</p>
        </div>
      </div>

      {/* Pedidos por Vendedor */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-7 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-[#007ACC] to-[#005B9E] text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Pedidos por Vendedor</h2>
        </div>
        <div className="space-y-3">
          {pedidosPorVendedor.map((item) => {
            const total = pedidosPorVendedor.reduce((acc, v) => acc + v._count.id, 0)
            const pct = total > 0 ? Math.round((item._count.id / total) * 100) : 0
            return (
              <div key={item.vendedorId} className="flex items-center gap-2 sm:gap-4">
                <span className="w-24 sm:w-36 truncate text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  {vendedorMap[item.vendedorId] ?? 'Desconhecido'}
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#007ACC] to-[#005B9E]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-bold text-slate-900 dark:text-slate-100">{item._count.id}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:gap-8 lg:grid-cols-3">
        {/* Status Cards */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-7 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFD700] text-[#0A0A0A]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002-2h2a2 2 0 00-2-2m4-3a1 1 0 01-1 1H9a1 1 0 01-1-1v-4a1 1 0 011-1h4a1 1 0 011 1v4z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Pedidos por Status</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
              {STATUS_KANBAN.map((status) => (
                <div key={status} className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50 p-5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`h-3 w-3 rounded-full bg-gradient-to-r ${STATUS_GRADIENTS[status]}`} />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{LABEL_STATUS[status]}</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{statusCounts[status]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Últimos Pedidos */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-7 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Últimos Pedidos</h2>
          </div>
          <div className="space-y-4">
            {ultimosPedidos.map((pedido) => (
              <div key={pedido.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-r ${STATUS_GRADIENTS[pedido.statusAtual]} flex items-center justify-center text-white font-bold text-sm`}>
                  {pedido.numero}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{pedido.cliente.nomeFantasia || pedido.cliente.razaoSocial}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{pedido.vendedor.nome}</p>
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
