import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { LABEL_STATUS } from '@/lib/status-flow'
import { Timeline } from './timeline'

export default async function DetalhePedidoPage(props: {
  params: Promise<{ pedidoId: string }>
}) {
  const { pedidoId } = await props.params

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      cliente: true,
      vendedor: { select: { nome: true, email: true } },
      itens: {
        include: {
          produto: { select: { codigo: true, descricao: true, unidade: true } },
        },
      },
      historico: {
        orderBy: { criadoEm: 'desc' },
        include: { usuario: { select: { nome: true, role: true } } },
      },
    },
  })

  if (!pedido) notFound()

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Coluna principal */}
      <div className="space-y-4 lg:col-span-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pedido #{pedido.numero}</h1>
          <p className="text-sm text-gray-500">
            Status atual:{' '}
            <span className="font-medium text-gray-800">{LABEL_STATUS[pedido.statusAtual]}</span>
          </p>
        </div>

        {/* Dados do pedido */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Dados do Pedido</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-gray-500">Cliente</dt>
            <dd className="text-gray-900">
              {pedido.cliente.nomeFantasia ?? pedido.cliente.razaoSocial}
            </dd>
            <dt className="text-gray-500">CNPJ</dt>
            <dd className="text-gray-900">{pedido.cliente.cnpj}</dd>
            <dt className="text-gray-500">Vendedor</dt>
            <dd className="text-gray-900">{pedido.vendedor.nome}</dd>
            <dt className="text-gray-500">Emissão</dt>
            <dd className="text-gray-900">
              {new Date(pedido.dataEmissao).toLocaleDateString('pt-BR')}
            </dd>
            <dt className="text-gray-500">Pagamento</dt>
            <dd className="text-gray-900">{pedido.condicaoPagamento}</dd>
            <dt className="text-gray-500">Valor total</dt>
            <dd className="font-semibold text-gray-900">
              {Number(pedido.valorTotal).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </dd>
          </dl>
        </div>

        {/* Itens */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Itens</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                <th className="pb-2 font-medium">Código</th>
                <th className="pb-2 font-medium">Descrição</th>
                <th className="pb-2 font-medium text-right">Qtd</th>
                <th className="pb-2 font-medium text-right">Preço</th>
                <th className="pb-2 font-medium text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {pedido.itens.map((item) => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="py-1.5 text-gray-500">{item.produto.codigo}</td>
                  <td className="py-1.5">{item.produto.descricao}</td>
                  <td className="py-1.5 text-right">
                    {item.quantidade} {item.produto.unidade}
                  </td>
                  <td className="py-1.5 text-right">
                    {Number(item.precoLiquido).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </td>
                  <td className="py-1.5 text-right">
                    {Number(item.subtotal).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Linha do Tempo</h2>
        <Timeline historico={pedido.historico} />
      </div>
    </div>
  )
}
