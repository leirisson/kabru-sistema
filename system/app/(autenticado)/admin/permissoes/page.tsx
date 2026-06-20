import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { getPermissoesRoles } from '@/lib/status-flow'
import { PermissaoForm } from './permissao-form'
import type { Role } from '@prisma/client'

export const metadata = { title: 'Permissões — Kabru Sistema' }

const ROLES_CONFIGURÁVEIS: Role[] = ['VENDEDOR', 'ESTOQUE', 'CONFERENCIA', 'FATURAMENTO', 'EXPEDICAO']

export default async function PermissoesPage() {
  const session = await verifySession()
  if (session.role !== 'ADMIN') redirect('/painel')

  const permissoes = await getPermissoesRoles()

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Permissões de Perfil</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Controle quais status cada perfil pode avançar no kanban</p>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
        <strong>Admin</strong> sempre tem acesso completo e não pode ser restringido.
        Vendedor não avança status — apenas visualiza.
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ROLES_CONFIGURÁVEIS.map((role) => (
          <PermissaoForm
            key={role}
            role={role}
            podeAvancarPara={permissoes[role]}
          />
        ))}
      </div>
    </div>
  )
}
