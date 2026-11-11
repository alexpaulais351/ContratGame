import { cn } from '@/lib/utils'
import type { CouleursCategorie } from './types'

/** Badge aux couleurs de la catégorie (palette secondaire VINCI). */
export function BadgeCategorie({ nom, couleurs, className }: { nom: string; couleurs: CouleursCategorie; className?: string }) {
  return (
    <span
      className={cn('inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold', className)}
      style={{ background: couleurs.couleurBg, borderColor: couleurs.couleurBorder, color: couleurs.couleurText }}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: couleurs.couleurPoint }} />
      <span className="truncate">{nom}</span>
    </span>
  )
}
