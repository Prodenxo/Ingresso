'use client'

import { ParticipantShell } from '@/components/layout/participant-shell'
import { EmpresasVinculadasCard } from '@/components/membros/empresas-vinculadas-card'
import { VincularCodigoCard } from '@/components/membros/vincular-codigo-card'
import { Button } from '@heroui/react'
import { useRequireParticipant } from '@/hooks/use-require-participant'
import { getEmpresasMembro } from '@/lib/auth-roles'
import { useEffect, useState } from 'react'

export default function VincularEmpresaPage() {
  const { isReady, user, refreshUser } = useRequireParticipant()
  const [mostrarForm, setMostrarForm] = useState(false)

  useEffect(() => {
    if (isReady) {
      void refreshUser()
    }
  }, [isReady, refreshUser])

  if (!isReady || !user) {
    return null
  }

  const empresasMembro = getEmpresasMembro(user)
  const jaVinculado = empresasMembro.length > 0

  return (
    <ParticipantShell
      title={jaVinculado ? 'Minhas empresas' : 'Vincular empresa'}
      subtitle={
        jaVinculado
          ? 'Organizações às quais você tem acesso'
          : 'Use o código ou link enviado pela organização'
      }
    >
      <div className="mx-auto flex max-w-lg flex-col gap-4">
        {jaVinculado ? (
          <>
            <EmpresasVinculadasCard empresas={empresasMembro} />
            {!mostrarForm ? (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onPress={() => setMostrarForm(true)}
              >
                Vincular outra empresa
              </Button>
            ) : (
              <VincularCodigoCard
                titulo="Vincular outra empresa"
                descricao="Digite o código de convite da outra organização."
                onSuccess={() => {
                  setMostrarForm(false)
                  void refreshUser()
                }}
              />
            )}
          </>
        ) : (
          <VincularCodigoCard onSuccess={() => void refreshUser()} />
        )}
      </div>
    </ParticipantShell>
  )
}
