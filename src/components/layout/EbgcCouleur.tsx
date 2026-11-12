/* eslint-disable @next/next/no-img-element */
import { cn } from '@/lib/utils'

/** Signature « by EBGC » en couleur (pour les fonds blancs). */
export function EbgcCouleur({ className, hauteur = 'h-8' }: { className?: string; hauteur?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-xs text-vinci-texte-secondaire', className)}>
      <span className="italic">by</span>
      <img src="/ebgc-couleur.png" alt="EBGC" width={195} height={69} className={cn('w-auto', hauteur)} />
    </span>
  )
}
