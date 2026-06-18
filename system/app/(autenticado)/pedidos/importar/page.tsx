import { verifySession } from '@/lib/dal'
import { redirect } from 'next/navigation'
import { RevisaoForm } from './revisao-form'

export const metadata = { title: 'Importar Pedido — Kabru Sistema' }

export default async function ImportarPedidoPage() {
  const session = await verifySession()

  if (session.role !== 'VENDEDOR' && session.role !== 'ADMIN') {
    redirect('/painel')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Importar Pedido via PDF</h1>
        <p className="mt-1 text-sm text-gray-500">
          Faça upload do PDF do pedido para pré-preenchimento automático dos dados.
        </p>
      </div>

      <RevisaoForm vendedorId={session.userId} />
    </div>
  )
}
