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
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold text-lg">
                K
              </div>
              <span className="text-xl font-bold text-slate-900">Kabru Sistema</span>
            </div>
            <nav className="flex gap-1">
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-2 2h-3m-6 0a1 1 0 001 1v4a1 1 0 001 1h2a1 1 0 001 1v4a1 1 0 00-1-1h-2a1 1 0 00-1 1v-4a1 1 0 00-1-1h-2a1 1 0 00-1 1v4m-2 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 00-1 1z" />
                </svg>
                Dashboard
              </Link>
              <Link 
                href="/painel" 
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Kanban
              </Link>
              <Link 
                href="/pedidos" 
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Todos Pedidos
              </Link>
              {(session.role === 'VENDEDOR' || session.role === 'ADMIN') && (
                <Link 
                  href="/pedidos/importar" 
                  className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Importar PDF
                </Link>
              )}
              {session.role === 'ADMIN' && (
                <>
                  <Link 
                    href="/admin/usuarios" 
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Usuários
                  </Link>
                  <Link 
                    href="/admin/sla" 
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    SLA
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-3 rounded-full bg-slate-100 px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-semibold">
                  {session.nome.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-slate-900">{session.nome}</p>
                  <span className="text-xs font-medium text-slate-500">{LABEL_ROLE[session.role]}</span>
                </div>
              </div>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl px-6 py-8">{children}</main>
    </div>
  )
}