import { verifySession } from '@/lib/dal'
import { logout } from '@/app/actions/auth'
import { Navbar } from '@/app/components/navbar'
import { getRotasPermitidasRole } from '@/lib/status-flow'

export default async function LayoutAutenticado({ children }: { children: React.ReactNode }) {
  const session = await verifySession()
  const rotasPermitidas = await getRotasPermitidasRole(session.role, session.userId)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar nome={session.nome} role={session.role} rotasPermitidas={rotasPermitidas} logoutAction={logout} />
      <main className="w-full px-3 py-4 sm:px-6 sm:py-8">{children}</main>
    </div>
  )
}
