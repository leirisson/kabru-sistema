import { verifySession } from '@/lib/dal'
import { logout } from '@/app/actions/auth'
import Link from 'next/link'
import type { Role } from '@prisma/client'

const LABEL_ROLE: Record<Role, string> = {
  ADMIN: 'Admin',
  VENDEDOR: 'Vendedor',
  ESTOQUE: 'Estoque',
  CONFERENCIA: 'Conferência',
  FATURAMENTO: 'Faturamento',
  EXPEDICAO: 'Expedição',
}

export default async function LayoutAutenticado({ children }: { children: React.ReactNode }) {
  const session = await verifySession()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-lg font-bold text-gray-900">Kabru Sistema</span>
            <nav className="flex gap-4 text-sm">
              <Link href="/painel" className="text-gray-600 hover:text-gray-900">
                Painel
              </Link>
              {(session.role === 'VENDEDOR' || session.role === 'ADMIN') && (
                <Link href="/pedidos/importar" className="text-gray-600 hover:text-gray-900">
                  Importar PDF
                </Link>
              )}
              {session.role === 'ADMIN' && (
                <>
                  <Link href="/admin/usuarios" className="text-gray-600 hover:text-gray-900">
                    Usuários
                  </Link>
                  <Link href="/admin/sla" className="text-gray-600 hover:text-gray-900">
                    SLA
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">
              {session.nome}{' '}
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                {LABEL_ROLE[session.role]}
              </span>
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl px-4 py-6">{children}</main>
    </div>
  )
}
