import { formatNombreFR } from '@/lib/utils'

export function BarreAvancement({ pct }: { pct: number }) {
  const largeur = Math.max(0, Math.min(100, pct))
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-sm bg-vinci-gris-bordure">
        <div className={pct > 100 ? 'h-full bg-vinci-rouge' : 'h-full bg-vinci-vert'} style={{ width: `${largeur}%` }} />
      </div>
      <span className="num w-14 text-right">{formatNombreFR(pct, 1)} %</span>
    </div>
  )
}
