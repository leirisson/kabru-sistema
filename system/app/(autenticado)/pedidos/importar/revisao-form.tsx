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
      <form onSubmit={handleUpload} className="flex flex-col gap-6">
        <div className="group relative overflow-hidden rounded-3xl border-2 border-dashed border-slate-300 bg-white p-10 text-center hover:border-indigo-500 hover:bg-indigo-50/50 transition-all">
          <div className="mb-4 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Selecione o PDF do pedido</h3>
          <p className="text-slate-500 text-sm mb-6">Arraste e solte ou clique para selecionar</p>
          <input
            type="file"
            name="pdf"
            accept="application/pdf"
            required
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-indigo-600 file:to-purple-600 file:text-white hover:file:from-indigo-700 hover:file:to-purple-700 transition-all"
          />
        </div>
        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Extrair dados do PDF
        </button>
      </form>
    )
  }

  if (estado.fase === 'carregando') {
    return (
      <div className="py-20 text-center">
        <div className="flex justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100">
            <svg className="animate-spin h-10 w-10 text-indigo-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Extraindo dados do PDF...</h3>
        <p className="text-slate-500">Aguarde enquanto processamos seu arquivo</p>
      </div>
    )
  }

  if (estado.fase === 'salvando') {
    return (
      <div className="py-20 text-center">
        <div className="flex justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100">
            <svg className="animate-spin h-10 w-10 text-emerald-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Salvando pedido...</h3>
        <p className="text-slate-500">Aguarde enquanto salvamos os dados</p>
      </div>
    )
  }

  if (estado.fase === 'erro') {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl bg-red-50 border border-red-200 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 flex-shrink-0">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-1">Ocorreu um erro</h3>
              <p className="text-red-700">{estado.mensagem}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setEstado({ fase: 'upload' })}
          className="flex items-center justify-center gap-2 self-center rounded-2xl border-2 border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
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
        <div className="flex items-start gap-4 rounded-2xl bg-amber-50 border border-amber-200 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 flex-shrink-0">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-amber-800 mb-1">Itens novos detectados</h3>
            <p className="text-amber-700">Itens em amarelo serão criados automaticamente ao confirmar o pedido.</p>
          </div>
        </div>
      )}

      {/* Dados gerais */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          Pedido #{dados.numeroPedido}
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <dt className="text-sm font-medium text-slate-500 mb-1">Emissão</dt>
            <dd className="text-base font-semibold text-slate-900">{dados.dataEmissao}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500 mb-1">Condição de Pagamento</dt>
            <dd className="text-base font-semibold text-slate-900">{dados.condicaoPagamento}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500 mb-1">Valor total</dt>
            <dd className="text-2xl font-bold text-indigo-600">
              {dados.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </dd>
          </div>
        </dl>
      </div>

      {/* Cliente */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900">Cliente</h2>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
              entidades.clienteExiste
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : 'bg-amber-100 text-amber-700 border border-amber-200'
            }`}
          >
            {entidades.clienteExiste ? (
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            )}
            {entidades.clienteExiste ? 'Existente' : 'Novo'}
          </span>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-slate-500 mb-1">Razão Social</dt>
            <dd className="text-base font-semibold text-slate-900">{dados.cliente.razaoSocial}</dd>
          </div>
          {dados.cliente.nomeFantasia && (
            <div>
              <dt className="text-sm font-medium text-slate-500 mb-1">Nome Fantasia</dt>
              <dd className="text-base font-semibold text-slate-900">{dados.cliente.nomeFantasia}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-slate-500 mb-1">CNPJ</dt>
            <dd className="text-base font-semibold text-slate-900">{dados.cliente.cnpj}</dd>
          </div>
          {dados.cliente.cidade && (
            <div>
              <dt className="text-sm font-medium text-slate-500 mb-1">Cidade/UF</dt>
              <dd className="text-base font-semibold text-slate-900">{dados.cliente.cidade}/{dados.cliente.estado}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Itens */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          Itens do Pedido
        </h2>
        <div className="flex flex-col gap-3">
          {dados.itens.map((item) => {
            const existe = entidades.produtosExistentes[item.codigoProduto]
            return (
              <div
                key={item.codigoProduto}
                className={`rounded-2xl border px-5 py-4 transition-all ${
                  existe
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-amber-200 bg-amber-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-bold text-slate-900">{item.codigoProduto}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        existe ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {existe ? (
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                        )}
                        {existe ? 'Existente' : 'Novo'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{item.descricao}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <span className="font-semibold text-slate-700">
                    {item.quantidade} {item.unidade}
                  </span>
                  <span className="text-slate-400">×</span>
                  <span className="font-semibold text-slate-700">
                    {item.precoLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span className="text-slate-400">=</span>
                  <span className="text-lg font-bold text-slate-900">
                    {item.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button
          onClick={() => setEstado({ fase: 'upload' })}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 text-base font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cancelar
        </button>
        <button
          onClick={handleConfirmar}
          disabled={pending}
          className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Salvando...
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Confirmar e salvar pedido
            </>
          )}
        </button>
      </div>
    </div>
  )
}
