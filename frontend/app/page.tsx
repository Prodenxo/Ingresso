import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="mesh-bg flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-indigo-400">
        EventHub
      </p>
      <h1 className="max-w-xl bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-4xl font-semibold text-transparent">
        Gestão de eventos e venda de ingressos
      </h1>
      <p className="max-w-md text-zinc-400">
        Projeto rodando. Acesse o painel administrativo para continuar.
      </p>
      <Link
        href="/dashboard"
        className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-indigo-500"
      >
        Ir para o Dashboard
      </Link>
    </main>
  )
}
