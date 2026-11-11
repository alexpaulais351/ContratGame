import { cn } from '@/lib/utils'

/** Signature « by EBGC ». variante 'clair' sur fond bleu, 'sombre' sur fond blanc. */
export function ByEbgc({ variante = 'clair', className }: { variante?: 'clair' | 'sombre'; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-baseline gap-1 select-none',
        variante === 'clair' ? 'text-white' : 'text-vinci-bleu',
        className,
      )}
    >
      <span className="text-[11px] italic opacity-80">by</span>
      <span className="text-sm font-black tracking-[0.12em]">EBGC</span>
    </span>
  )
}
