import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { verifyRotaPermitida } from '@/lib/dal'
import { LABEL_STATUS } from '@/lib/status-flow'
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

const TODOS_STATUS: StatusPedido[] = [
  'AGUARDANDO_SEPARACAO',
  'SEPARACAO',
  'CONFERENCIA',
  'CONFERIDO',
  'FATURAMENTO',
  'SEPARACAO_DESTINATARIO',
  'CONCLUIDO',
]

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Todos os Pedidos — Kabru Sistema' }

interface SearchParams {
  numero?: string
  vendedorId?: string
  cliente?: string
  status?: string
  dataInicio?: string
  dataFim?: string
}

export default async function TodosPedidosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await verifyRotaPermitida('/pedidos')
  const params = await searchParams

  const isVendedor = session.role === 'VENDEDOR'

  const numeroInt = params.numero ? parseInt(params.numero, 10) : undefined

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

  const where = {
    ...(numeroInt && !isNaN(numeroInt) ? { numero: numeroInt } : {}),
    ...(!isVendedor && params.vendedorId ? { vendedorId: params.vendedorId } : {}),
    ...(params.cliente
      ? {
          cliente: {
            OR: [
              { nomeFantasia: { contains: params.cliente, mode: 'insensitive' as const } },
              { razaoSocial: { contains: params.cliente, mode: 'insensitive' as const } },
            ],
          },
        }
      : {}),
    ...(params.status ? { statusAtual: params.status as StatusPedido } : {}),
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
      include: {
        cliente: true,
        vendedor: true,
        itens: { include: { produto: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    !isVendedor
      ? prisma.usuario.findMany({
          where: { role: 'VENDEDOR' },
          orderBy: { nome: 'asc' },
          select: { id: true, nome: true },
        })
      : Promise.resolve([]),
  ])

  const temFiltro =
    params.numero || params.vendedorId || params.cliente || params.status || params.dataInicio || params.dataFim

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shrink-0">
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">Todos os Pedidos</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{pedidos.length} pedido(s) encontrado(s)</p>
          </div>
        </div>
        {(session.role === 'VENDEDOR' || session.role === 'ADMIN') && (
          <Link
            href="/pedidos/importar"
            className="flex items-center gap-2 rounded-2xl bg-black px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 transition-all dark:bg-white dark:text-black dark:hover:bg-slate-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="hidden sm:inline">Importar PDF</span>
            <span className="sm:hidden">Importar</span>
          </Link>
        )}
      </div>

      {/* Filtros */}
      <form method="GET" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFD700] text-[#0A0A0A]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Filtros</h2>
          {temFiltro && (
            <Link
              href="/pedidos"
              className="ml-auto text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              Limpar filtros
            </Link>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Nº do Pedido
            </label>
            <input
              type="number"
              name="numero"
              defaultValue={params.numero ?? ''}
              placeholder="Ex: 42"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700]/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Cliente
            </label>
            <input
              type="text"
              name="cliente"
              defaultValue={params.cliente ?? ''}
              placeholder="Nome ou razão social"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700]/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>

          {!isVendedor && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Vendedor
              </label>
              <select
                name="vendedorId"
                defaultValue={params.vendedorId ?? ''}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700]/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                <option value="">Todos</option>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id}>{v.nome}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Status
            </label>
            <select
              name="status"
              defaultValue={params.status ?? ''}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700]/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            >
              <option value="">Todos</option>
              {TODOS_STATUS.map(s => (
                <option key={s} value={s}>{LABEL_STATUS[s]}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1 grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Emissão — início
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
                Emissão — fim
              </label>
              <input
                type="date"
                name="dataFim"
                defaultValue={params.dataFim ?? ''}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700]/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="submit"
            className="rounded-xl bg-black px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-slate-200"
          >
            Aplicar filtros
          </button>
        </div>
      </form>

      {/* Tabela */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100 dark:bg-slate-700/50 dark:border-slate-700">
              <tr>
                <th className="px-4 sm:px-8 py-4 sm:py-5 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Pedido</th>
                <th className="px-4 sm:px-8 py-4 sm:py-5 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Cliente</th>
                <th className="px-4 sm:px-8 py-4 sm:py-5 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400 hidden md:table-cell">Vendedor</th>
                <th className="px-4 sm:px-8 py-4 sm:py-5 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Status</th>
                <th className="px-4 sm:px-8 py-4 sm:py-5 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400 hidden sm:table-cell">Data Emissão</th>
                <th className="px-4 sm:px-8 py-4 sm:py-5 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400 hidden lg:table-cell">Itens</th>
                <th className="px-4 sm:px-8 py-4 sm:py-5 text-right text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Valor Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {pedidos.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 sm:px-8 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    Nenhum pedido encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
              {pedidos.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-slate-50/70 transition-colors group dark:hover:bg-slate-700/50">
                  <td className="px-4 sm:px-8 py-4 sm:py-5">
                    <Link href={`/painel/${pedido.id}`} className="flex items-center gap-2 sm:gap-4">
                      <div className={`flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl text-white text-xs sm:text-sm font-bold shrink-0 ${STATUS_COLORS[pedido.statusAtual]}`}>
                        {pedido.numero}
                      </div>
                      <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors dark:text-slate-100 dark:group-hover:text-indigo-400">#{pedido.numero}</span>
                    </Link>
                  </td>
                  <td className="px-4 sm:px-8 py-4 sm:py-5">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{pedido.cliente.nomeFantasia || pedido.cliente.razaoSocial}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{pedido.cliente.cnpj}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-8 py-4 sm:py-5 hidden md:table-cell">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{pedido.vendedor.nome}</span>
                  </td>
                  <td className="px-4 sm:px-8 py-4 sm:py-5">
                    <span className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold text-white ${STATUS_COLORS[pedido.statusAtual]}`}>
                      {LABEL_STATUS[pedido.statusAtual]}
                    </span>
                  </td>
                  <td className="px-4 sm:px-8 py-4 sm:py-5 hidden sm:table-cell">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {new Date(pedido.dataEmissao).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="px-4 sm:px-8 py-4 sm:py-5 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{pedido.itens.length}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-8 py-4 sm:py-5 text-right">
                    <span className="text-sm sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                      {Number(pedido.valorTotal).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
