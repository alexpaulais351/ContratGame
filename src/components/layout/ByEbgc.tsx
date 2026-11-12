/* eslint-disable @next/next/no-img-element */
import { cn } from '@/lib/utils'

/** Signature « by EBGC » (logo blanc : à placer sur fond bleu VINCI). */
export function ByEbgc({ className, hauteur = 'h-7' }: { className?: string; hauteur?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-xs text-white/70', className)} data-testid="signature-ebgc">
      <span className="italic">by</span>
      <img src="/ebgc-blanc.png" alt="EBGC" width={195} height={69} className={cn('w-auto', hauteur)} />
    </span>
  )
}
