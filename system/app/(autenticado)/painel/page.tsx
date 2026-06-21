import { prisma } from '@/lib/prisma'
import { verifyRotaPermitida } from '@/lib/dal'
import { calcularSla, formatarDecorrido } from '@/lib/sla'
import { STATUS_KANBAN, LABEL_STATUS, getPermissoesUsuario } from '@/lib/status-flow'
import type { StatusPedido } from '@prisma/client'
import { KanbanColuna } from './kanban-coluna'
import { KanbanMobile } from './kanban-mobile'
import { MetricasHeader } from './metricas-header'
import { PainelPoller } from './painel-poller'
import { FullscreenToggle } from './fullscreen-toggle'

export const dynamic = 'force-dynamic'

export default async function PainelPage(props: {
  searchParams: Promise<{ vendedorId?: string }>
}) {
  const [session, searchParams] = await Promise.all([
    verifyRotaPermitida('/painel'),
    props.searchParams,
  ])

  const filtroVendedorId = searchParams.vendedorId

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const [pedidos, slaConfigs, concluidosHoje, permissoes] = await Promise.all([
    prisma.pedido.findMany({
      where: {
        statusAtual: { not: { equals: 'CONCLUIDO' } },
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
    getPermissoesUsuario(session.userId, session.role),
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

      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Painel de Pedidos</h1>
        <div className="flex items-center gap-2">
          {filtroVendedorId && (
            <a href="/painel" className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpar filtro
            </a>
          )}
          <FullscreenToggle />
        </div>
      </div>

      <MetricasHeader
        pedidos={pedidosComSla.map((p) => ({ statusAtual: p.statusAtual as StatusPedido, slaStatus: p.slaStatus }))}
        concluidosHoje={concluidosHoje}
      />

      {/* Mobile: abas, uma coluna por vez */}
      <div className="lg:hidden">
        <KanbanMobile
          colunas={colunas}
          userRole={session.role}
          podeAvancarPara={permissoes.podeAvancarPara}
        />
      </div>

      {/* Desktop: todas as colunas em grid */}
      <div className="hidden lg:grid gap-4" style={{ gridTemplateColumns: `repeat(${STATUS_KANBAN.length}, minmax(0, 1fr))` }}>
        {colunas.map(({ status, pedidos: colPedidos }) => (
          <KanbanColuna
            key={status}
            status={status as StatusPedido}
            pedidos={colPedidos}
            userRole={session.role}
            podeAvancarPara={permissoes.podeAvancarPara}
          />
        ))}
      </div>

      <p className="mt-6 text-right text-xs text-slate-400 dark:text-slate-500 flex items-center justify-end gap-2">
        <svg className="h-3 w-3 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        Atualiza automaticamente a cada 20 segundos
      </p>
    </div>
  )
}
