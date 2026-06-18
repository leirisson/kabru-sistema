'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { importarPedidoPDF, type ImportacaoResult, type EntidadesExistentes } from '@/app/actions/importar-pedido'
import { salvarPedidoImportado } from '@/app/actions/pedidos'
import type { PedidoImportado } from '@/schemas/pedido-importado'

type Props = { vendedorId: string }

type Estado =
  | { fase: 'upload' }
  | { fase: 'carregando' }
  | { fase: 'revisao'; dados: PedidoImportado; entidades: EntidadesExistentes }
  | { fase: 'erro'; mensagem: string }
  | { fase: 'salvando' }

export function RevisaoForm({ vendedorId }: Props) {
  const router = useRouter()
  const [estado, setEstado] = useState<Estado>({ fase: 'upload' })
  const [pending, startTransition] = useTransition()

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEstado({ fase: 'carregando' })

    const formData = new FormData(e.currentTarget)
    const result: ImportacaoResult = await importarPedidoPDF(formData)

    if ('erro' in result && result.erro) {
      setEstado({ fase: 'erro', mensagem: result.erro })
    } else if (result.data && result.entidades) {
      setEstado({ fase: 'revisao', dados: result.data, entidades: result.entidades })
    }
  }

  function handleConfirmar() {
    if (estado.fase !== 'revisao') return
    const { dados, entidades } = estado

    const temPendentes = dados.itens.some((i) => !entidades.produtosExistentes[i.codigoProduto] && !i.codigoProduto)
    if (temPendentes) return

    setEstado({ fase: 'salvando' })

    startTransition(async () => {
      const result = await salvarPedidoImportado({
        numeroPedido: dados.numeroPedido,
        dataEmissao: dados.dataEmissao,
        condicaoPagamento: dados.condicaoPagamento,
        vendedorId,
        cliente: dados.cliente,
        itens: dados.itens,
        valorTotal: dados.valorTotal,
      })

      if (result.erro) {
        setEstado({ fase: 'erro', mensagem: result.erro })
      } else {
        router.push('/painel')
      }
    })
  }

  if (estado.fase === 'upload') {
    return (
      <form onSubmit={handleUpload} className="flex flex-col gap-4">
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <p className="mb-2 text-sm text-gray-600">Selecione o PDF do pedido</p>
          <input
            type="file"
            name="pdf"
            accept="application/pdf"
            required
            className="text-sm text-gray-700"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Extrair dados
        </button>
      </form>
    )
  }

  if (estado.fase === 'carregando') {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-500">Extraindo dados do PDF...</p>
      </div>
    )
  }

  if (estado.fase === 'salvando') {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-500">Salvando pedido...</p>
      </div>
    )
  }

  if (estado.fase === 'erro') {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{estado.mensagem}</div>
        <button
          onClick={() => setEstado({ fase: 'upload' })}
          className="self-start rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  const { dados, entidades } = estado
  const temNovos = Object.values(entidades.produtosExistentes).some((e) => !e) || !entidades.clienteExiste

  return (
    <div className="flex flex-col gap-6">
      {/* Aviso de itens novos */}
      {temNovos && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
          Itens em amarelo serão criados automaticamente ao confirmar o pedido.
        </div>
      )}

      {/* Dados gerais */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Pedido #{dados.numeroPedido}</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-gray-500">Emissão</dt>
          <dd>{dados.dataEmissao}</dd>
          <dt className="text-gray-500">Pagamento</dt>
          <dd>{dados.condicaoPagamento}</dd>
          <dt className="text-gray-500">Valor total</dt>
          <dd className="font-semibold">
            {dados.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </dd>
        </dl>
      </div>

      {/* Cliente */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-700">Cliente</h2>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              entidades.clienteExiste
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {entidades.clienteExiste ? 'Existente' : 'Novo'}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-gray-500">Razão Social</dt>
          <dd>{dados.cliente.razaoSocial}</dd>
          {dados.cliente.nomeFantasia && (
            <>
              <dt className="text-gray-500">Nome Fantasia</dt>
              <dd>{dados.cliente.nomeFantasia}</dd>
            </>
          )}
          <dt className="text-gray-500">CNPJ</dt>
          <dd>{dados.cliente.cnpj}</dd>
          {dados.cliente.cidade && (
            <>
              <dt className="text-gray-500">Cidade/UF</dt>
              <dd>{dados.cliente.cidade}/{dados.cliente.estado}</dd>
            </>
          )}
        </dl>
      </div>

      {/* Itens */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Itens</h2>
        <div className="flex flex-col gap-2">
          {dados.itens.map((item) => {
            const existe = entidades.produtosExistentes[item.codigoProduto]
            return (
              <div
                key={item.codigoProduto}
                className={`rounded border px-3 py-2 text-sm ${
                  existe
                    ? 'border-green-200 bg-green-50'
                    : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-medium">{item.codigoProduto}</span>{' '}
                    <span className="text-gray-600">{item.descricao}</span>
                  </div>
                  <span className={`text-xs font-medium ${existe ? 'text-green-700' : 'text-yellow-700'}`}>
                    {existe ? 'Existente' : 'Novo'}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {item.quantidade} {item.unidade} &times;{' '}
                  {item.precoLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  {' '}= {item.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setEstado({ fase: 'upload' })}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirmar}
          disabled={pending}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {pending ? 'Salvando...' : 'Confirmar e salvar pedido'}
        </button>
      </div>
    </div>
  )
}
