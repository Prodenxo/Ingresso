'use client'

interface LotePrecoPromoProps {
  preco: number
  precoDe?: number | null
  size?: 'sm' | 'md'
  showLabel?: boolean
}

export function LotePrecoPromo({
  preco,
  precoDe,
  size = 'md',
  showLabel = false,
}: LotePrecoPromoProps) {
  const hasPromo = precoDe != null && precoDe > preco
  const textSize = size === 'sm' ? 'text-sm' : 'text-base'

  const priceContent = hasPromo ? (
    <>
      <span className="text-zinc-500">De </span>
      <span className="text-zinc-400 line-through">
        {new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(precoDe)}
      </span>
      <span className="text-zinc-500"> por </span>
      <span className="font-semibold text-emerald-400">
        {new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(preco)}
      </span>
    </>
  ) : (
    <span className="font-semibold text-white">
      {new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(preco)}
    </span>
  )

  if (showLabel) {
    return (
      <p className={`leading-snug ${textSize}`}>
        <span className="text-zinc-400">Valor unitário: </span>
        {priceContent}
      </p>
    )
  }

  return <p className={`leading-snug ${textSize}`}>{priceContent}</p>
}
