import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import { calcularSla, formatarDecorrido } from '@/lib/sla'
import { STATUS_KANBAN, LABEL_STATUS } from '@/lib/status-flow'
import type { StatusPedido } from '@prisma/client'
import { KanbanColuna } from './kanban-coluna'
import { MetricasHeader } from './metricas-header'
import { PainelPoller } from './painel-poller'

export const dynamic = 'force-dynamic'

export default async function PainelPage(props: {
  searchParams: Promise<{ vendedorId?: string }>
}) {
  const [session, searchParams] = await Promise.all([
    verifySession(),
    props.searchParams,
  ])

  const filtroVendedorId = searchParams.vendedorId

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const [pedidos, slaConfigs, concluidosHoje] = await Promise.all([
    prisma.pedido.findMany({
      where: {
        statusAtual: { not: 'CONCLUIDO' },
        ...(filtroVendedorId ? { vendedorId: filtroVendedorId } : {}),
      },
      include: {
        cliente: { select: { nomeFantasia: true, razaoSocial: true } },
        vendedor: { select: { nome: true } },
        historico: { orderBy: { criadoEm: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.slaConfig.findMany(),
    prisma.pedido.count({
      where: {
        statusAtual: 'CONCLUIDO',
        ...(filtroVendedorId ? { vendedorId: filtroVendedorId } : {}),
        historico: { some: { status: 'CONCLUIDO', criadoEm: { gte: hoje } } },
      },
    }),
  ])

  const slaMap = Object.fromEntries(slaConfigs.map((c) => [c.status, c]))

  const pedidosComSla = pedidos.map((p) => {
    const ultimaTransicao = p.historico[0]?.criadoEm ?? p.createdAt
    const cfg = slaMap[p.statusAtual]
    const slaStatus = cfg
      ? calcularSla(ultimaTransicao, cfg.avisoMinutos, cfg.criticoMinutos)
      : 'verde'
    return {
      ...p,
      valorTotal: p.valorTotal.toString(),
      slaStatus,
      tempoDecorrido: formatarDecorrido(ultimaTransicao),
    }
  })

  const colunas = STATUS_KANBAN.map((status) => ({
    status,
    pedidos: pedidosComSla.filter((p) => p.statusAtual === status),
  }))

  return (
    <div>
      <PainelPoller intervaloMs={20000} />

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Painel de Pedidos</h1>
        {filtroVendedorId && (
          <a href="/painel" className="text-sm text-blue-600 hover:underline">
            Limpar filtro
          </a>
        )}
      </div>

      <MetricasHeader
        pedidos={pedidosComSla.map((p) => ({ statusAtual: p.statusAtual as StatusPedido, slaStatus: p.slaStatus }))}
        concluidosHoje={concluidosHoje}
      />

      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${STATUS_KANBAN.length}, minmax(0, 1fr))` }}>
        {colunas.map(({ status, pedidos: colPedidos }) => (
          <KanbanColuna
            key={status}
            status={status as StatusPedido}
            pedidos={colPedidos}
            userRole={session.role}
          />
        ))}
      </div>

      <p className="mt-4 text-right text-xs text-gray-400">
        Atualiza automaticamente a cada 20 segundos
      </p>
    </div>
  )
}
