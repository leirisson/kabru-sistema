import { verifyRotaPermitida } from '@/lib/dal'
import { RevisaoForm } from './revisao-form'

export const metadata = { title: 'Importar Pedido — Kabru Sistema' }

export default async function ImportarPedidoPage() {
  const session = await verifyRotaPermitida('/pedidos/importar')

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Importar Pedido via PDF</h1>
        </div>
        <p className="text-sm text-slate-500">
          Faça upload do PDF do pedido para pré-preenchimento automático dos dados.
        </p>
      </div>

      <RevisaoForm vendedorId={session.userId} />
    </div>
  )
}
