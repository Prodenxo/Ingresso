import { Suspense } from 'react'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mesh-bg flex min-h-screen items-center justify-center p-6">
          <p className="text-sm text-zinc-400">Carregando...</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
