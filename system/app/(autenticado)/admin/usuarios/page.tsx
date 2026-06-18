import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import { UsuarioForm } from './usuario-form'
import { DeletarUsuarioButton } from './deletar-usuario-button'
import type { Role } from '@prisma/client'

const LABEL_ROLE: Record<Role, string> = {
  ADMIN: 'Admin',
  VENDEDOR: 'Vendedor',
  ESTOQUE: 'Estoque',
  CONFERENCIA: 'Conferência',
  FATURAMENTO: 'Faturamento',
  EXPEDICAO: 'Expedição',
}

const ROLE_COLORS: Record<Role, string> = {
  ADMIN: 'bg-gradient-to-r from-purple-500 to-pink-500',
  VENDEDOR: 'bg-gradient-to-r from-blue-500 to-cyan-500',
  ESTOQUE: 'bg-gradient-to-r from-green-500 to-emerald-500',
  CONFERENCIA: 'bg-gradient-to-r from-yellow-500 to-amber-500',
  FATURAMENTO: 'bg-gradient-to-r from-orange-500 to-red-500',
  EXPEDICAO: 'bg-gradient-to-r from-indigo-500 to-violet-500',
}

export const metadata = { title: 'Usuários — Kabru Sistema' }

export default async function UsuariosPage() {
  const session = await verifySession()
  if (session.role !== 'ADMIN') redirect('/painel')

  const usuarios = await prisma.usuario.findMany({ orderBy: { nome: 'asc' } })

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestão de Usuários</h1>
          <p className="text-sm text-slate-500">Adicione, edite e remova usuários do sistema</p>
        </div>
      </div>

      {/* Formulário de criação */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Novo Usuário</h2>
        </div>
        <UsuarioForm />
      </div>

      {/* Lista */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-900">Todos os Usuários</h2>
          <p className="text-sm text-slate-500">{usuarios.length} usuário(s) cadastrado(s)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">Nome</th>
                <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">Email</th>
                <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">Cargo</th>
                <th className="px-8 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${ROLE_COLORS[usuario.role]} text-white text-sm font-bold`}>
                        {usuario.nome.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-900">{usuario.nome}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-slate-600">{usuario.email}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold text-white ${ROLE_COLORS[usuario.role]}`}>
                      {LABEL_ROLE[usuario.role]}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <DeletarUsuarioButton id={usuario.id} nome={usuario.nome} />
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
