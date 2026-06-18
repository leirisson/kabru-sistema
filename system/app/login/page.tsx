import { LoginForm } from './login-form'

export const metadata = { title: 'Login — Kabru Sistema' }

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm border border-gray-200">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Kabru Sistema</h1>
          <p className="mt-1 text-sm text-gray-500">Painel de acompanhamento de pedidos</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
