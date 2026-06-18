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

export const metadata = { title: 'Usuários — Kabru Sistema' }

export default async function UsuariosPage() {
  const session = await verifySession()
  if (session.role !== 'ADMIN') redirect('/painel')

  const usuarios = await prisma.usuario.findMany({ orderBy: { nome: 'asc' } })

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Gestão de Usuários</h1>

      {/* Formulário de criação */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Novo Usuário</h2>
        <UsuarioForm />
      </div>

      {/* Lista */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Role</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-gray-50">
                <td className="px-4 py-3">{u.nome}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {LABEL_ROLE[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <DeletarUsuarioButton id={u.id} nome={u.nome} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
