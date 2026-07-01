import { Suspense } from 'react'
import { RegisterForm } from './register-form'

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="mesh-bg flex min-h-screen items-center justify-center p-6">
          <p className="text-sm text-zinc-400">Carregando...</p>
        </main>
      }
    >
      <RegisterForm />
    </Suspense>
  )
}
