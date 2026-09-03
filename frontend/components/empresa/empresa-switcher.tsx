'use client'

import { Button, ListBox, Select } from '@heroui/react'
import { Building2, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEmpresa } from '@/components/empresa/empresa-provider'

export function EmpresaSwitcher() {
  const router = useRouter()
  const { empresas, empresaAtiva, empresaAtivaId, isLoading, isSuperAdmin, setEmpresaAtiva } =
    useEmpresa()

  if (!isSuperAdmin) {
    return null
  }

  function handleChange(empresaId: string) {
    if (empresaId === empresaAtivaId) {
      return
    }

    setEmpresaAtiva(empresaId)
    router.refresh()
  }

  if (isLoading && !empresaAtiva) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
        Carregando empresas...
      </div>
    )
  }

  if (empresas.length === 0) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
        Nenhuma empresa cadastrada
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="hidden size-4 text-amber-300 sm:block" aria-hidden />
      <Select
        aria-label="Empresa ativa"
        selectedKey={empresaAtivaId ?? undefined}
        onSelectionChange={(key) => {
          if (typeof key === 'string') {
            handleChange(key)
          }
        }}
        className="min-w-[220px]"
      >
        <Select.Trigger className="rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-50">
          <Select.Value>
            {empresaAtiva?.nome ?? 'Selecionar empresa'}
          </Select.Value>
          <Select.Indicator>
            <ChevronDown className="size-4" />
          </Select.Indicator>
        </Select.Trigger>
        <Select.Popover>
          <ListBox items={empresas}>
            {(empresa) => (
              <ListBox.Item key={empresa.id} id={empresa.id} textValue={empresa.nome}>
                <div className="flex flex-col gap-0.5 py-0.5">
                  <span className="font-medium">{empresa.nome}</span>
                  <span className="text-xs text-zinc-500">
                    {empresa.totalEventos ?? 0} eventos · {empresa.totalMembros ?? 0} membros
                  </span>
                </div>
              </ListBox.Item>
            )}
          </ListBox>
        </Select.Popover>
      </Select>
      <Button
        size="sm"
        variant="ghost"
        className="hidden text-amber-200 lg:inline-flex"
        onPress={() => router.push('/empresas')}
      >
        Ver todas
      </Button>
    </div>
  )
}
