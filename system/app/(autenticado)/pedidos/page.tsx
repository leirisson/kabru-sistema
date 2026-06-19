import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
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

export const metadata = { title: 'Todos os Pedidos — Kabru Sistema' }

export default async function TodosPedidosPage() {
  const session = await verifySession()

  const pedidos = await prisma.pedido.findMany({
    include: {
      cliente: true,
      vendedor: true,
      itens: { include: { produto: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Todos os Pedidos</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{pedidos.length} pedido(s) encontrado(s)</p>
          </div>
        </div>
        {(session.role === 'VENDEDOR' || session.role === 'ADMIN') && (
          <Link
            href="/pedidos/importar"
            className="flex items-center gap-2 rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 transition-all dark:bg-white dark:text-black dark:hover:bg-slate-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Importar PDF
          </Link>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100 dark:bg-slate-700/50 dark:border-slate-700">
              <tr>
                <th className="px-8 py-5 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Pedido</th>
                <th className="px-8 py-5 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Cliente</th>
                <th className="px-8 py-5 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Vendedor</th>
                <th className="px-8 py-5 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Status</th>
                <th className="px-8 py-5 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Data Emissão</th>
                <th className="px-8 py-5 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Itens</th>
                <th className="px-8 py-5 text-right text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Valor Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {pedidos.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-slate-50/70 transition-colors group dark:hover:bg-slate-700/50">
                  <td className="px-8 py-5">
                    <Link href={`/painel/${pedido.id}`} className="flex items-center gap-4">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-white text-sm font-bold ${STATUS_COLORS[pedido.statusAtual]}`}>
                        {pedido.numero}
                      </div>
                      <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors dark:text-slate-100 dark:group-hover:text-indigo-400">#{pedido.numero}</span>
                    </Link>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{pedido.cliente.nomeFantasia || pedido.cliente.razaoSocial}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{pedido.cliente.cnpj}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-slate-700 dark:text-slate-300">{pedido.vendedor.nome}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold text-white ${STATUS_COLORS[pedido.statusAtual]}`}>
                      {LABEL_STATUS[pedido.statusAtual]}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-slate-700 dark:text-slate-300">
                      {new Date(pedido.dataEmissao).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{pedido.itens.length}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
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
