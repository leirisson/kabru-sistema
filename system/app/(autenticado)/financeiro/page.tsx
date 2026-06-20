import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import { redirect } from 'next/navigation'
import { LABEL_STATUS } from '@/lib/status-flow'
import Link from 'next/link'
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

const STATUS_FINANCEIROS: StatusPedido[] = ['FATURAMENTO', 'SEPARACAO_DESTINATARIO', 'CONCLUIDO']

export const metadata = { title: 'Financeiro — Kabru Sistema' }

interface SearchParams {
  vendedorId?: string
  status?: string
  dataInicio?: string
  dataFim?: string
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await verifySession()

  const roles_permitidos = ['ADMIN', 'FATURAMENTO', 'VENDEDOR'] as const
  if (!roles_permitidos.includes(session.role as (typeof roles_permitidos)[number])) {
    redirect('/dashboard')
  }

  const params = await searchParams
  const isVendedor = session.role === 'VENDEDOR'
  const podeVerTodos = session.role === 'ADMIN' || session.role === 'FATURAMENTO'

  // Monta filtros de data
  let dataInicio: Date | undefined
  let dataFim: Date | undefined
  if (params.dataInicio) {
    dataInicio = new Date(params.dataInicio)
    dataInicio.setHours(0, 0, 0, 0)
  }
  if (params.dataFim) {
    dataFim = new Date(params.dataFim)
    dataFim.setHours(23, 59, 59, 999)
  }

  // Monta where clause baseado no papel
  const where = {
    ...(isVendedor ? { vendedorId: session.userId } : {}),
    ...(podeVerTodos && params.vendedorId ? { vendedorId: params.vendedorId } : {}),
    ...(params.status ? { statusAtual: params.status as StatusPedido } : { statusAtual: { in: STATUS_FINANCEIROS } }),
    ...(dataInicio || dataFim
      ? {
          dataEmissao: {
            ...(dataInicio ? { gte: dataInicio } : {}),
            ...(dataFim ? { lte: dataFim } : {}),
          },
        }
      : {}),
  }

  const [pedidos, vendedores] = await Promise.all([
    prisma.pedido.findMany({
      where,
      include: { cliente: true, vendedor: true, itens: true },
      orderBy: { dataEmissao: 'desc' },
    }),
    podeVerTodos
      ? prisma.usuario.findMany({
          where: { role: 'VENDEDOR' },
          orderBy: { nome: 'asc' },
          select: { id: true, nome: true },
        })
      : Promise.resolve([]),
  ])

  const totalFaturado = pedidos.reduce((sum, p) => sum + Number(p.valorTotal), 0)
  const totalConcluidos = pedidos.filter(p => p.statusAtual === 'CONCLUIDO').length
  const totalEmFaturamento = pedidos.filter(p => p.statusAtual === 'FATURAMENTO').length
  const ticketMedio = pedidos.length > 0 ? totalFaturado / pedidos.length : 0

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Financeiro</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isVendedor ? 'Seus pedidos em faturamento' : 'Visão financeira geral'}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros — apenas para ADMIN e FATURAMENTO */}
      {podeVerTodos && (
        <form method="GET" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFD700] text-[#0A0A0A]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Filtros</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Vendedor
              </label>
              <select
                name="vendedorId"
                defaultValue={params.vendedorId ?? ''}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700]/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                <option value="">Todos os vendedores</option>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id}>{v.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Status
              </label>
              <select
                name="status"
                defaultValue={params.status ?? ''}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700]/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                <option value="">Faturamento + Expedição + Concluído</option>
                {STATUS_FINANCEIROS.map(s => (
                  <option key={s} value={s}>{LABEL_STATUS[s]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Data emissão — início
              </label>
              <input
                type="date"
                name="dataInicio"
                defaultValue={params.dataInicio ?? ''}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700]/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Data emissão — fim
              </label>
              <input
                type="date"
                name="dataFim"
                defaultValue={params.dataFim ?? ''}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700]/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              className="rounded-xl bg-black px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-slate-200"
            >
              Aplicar filtros
            </button>
            <Link
              href="/financeiro"
              className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              Limpar
            </Link>
          </div>
        </form>
      )}

      {/* Métricas */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group rounded-3xl bg-white p-7 shadow-sm border border-slate-200 hover:shadow-md transition-all dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Faturado</h3>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{fmt(totalFaturado)}</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{pedidos.length} pedido(s)</p>
        </div>

        <div className="group rounded-3xl bg-white p-7 shadow-sm border border-slate-200 hover:shadow-md transition-all dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Ticket Médio</h3>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#007ACC] to-[#005B9E] text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{fmt(ticketMedio)}</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">por pedido</p>
        </div>

        <div className="group rounded-3xl bg-white p-7 shadow-sm border border-slate-200 hover:shadow-md transition-all dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Concluídos</h3>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-bold text-slate-900 dark:text-slate-100">{totalConcluidos}</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">pedidos entregues</p>
        </div>

        <div className="group rounded-3xl bg-white p-7 shadow-sm border border-slate-200 hover:shadow-md transition-all dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Em Faturamento</h3>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#F97316] to-[#DC2626] text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m6 6l-3 3m0 0l-3-3m3 3V9" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-bold text-slate-900 dark:text-slate-100">{totalEmFaturamento}</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">aguardando nota fiscal</p>
        </div>
      </div>

      {/* Tabela de pedidos */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-700 dark:bg-slate-800">
        <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Pedidos ({pedidos.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100 dark:bg-slate-700/50 dark:border-slate-700">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Pedido</th>
                <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Cliente</th>
                {podeVerTodos && (
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Vendedor</th>
                )}
                <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Status</th>
                <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Emissão</th>
                <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Cond. Pagto</th>
                <th className="px-8 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Valor Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {pedidos.length === 0 && (
                <tr>
                  <td colSpan={podeVerTodos ? 7 : 6} className="px-8 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    Nenhum pedido encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
              {pedidos.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-slate-50/70 transition-colors group dark:hover:bg-slate-700/50">
                  <td className="px-8 py-4">
                    <Link href={`/painel/${pedido.id}`} className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white text-sm font-bold ${STATUS_COLORS[pedido.statusAtual]}`}>
                        {pedido.numero}
                      </div>
                      <span className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors dark:text-slate-100 dark:group-hover:text-emerald-400">
                        #{pedido.numero}
                      </span>
                    </Link>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{pedido.cliente.nomeFantasia || pedido.cliente.razaoSocial}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{pedido.cliente.cnpj}</span>
                    </div>
                  </td>
                  {podeVerTodos && (
                    <td className="px-8 py-4">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{pedido.vendedor.nome}</span>
                    </td>
                  )}
                  <td className="px-8 py-4">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold text-white ${STATUS_COLORS[pedido.statusAtual]}`}>
                      {LABEL_STATUS[pedido.statusAtual]}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {new Date(pedido.dataEmissao).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{pedido.condicaoPagamento}</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {fmt(Number(pedido.valorTotal))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {pedidos.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-200 dark:bg-slate-700/50 dark:border-slate-600">
                <tr>
                  <td colSpan={podeVerTodos ? 6 : 5} className="px-8 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">
                    Total ({pedidos.length} pedidos)
                  </td>
                  <td className="px-8 py-4 text-right text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {fmt(totalFaturado)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
