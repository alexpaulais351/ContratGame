import { VINCI } from '@/lib/design-tokens'

/** Logo Contrat Game : marteau du juge (base juridique) sur socle rouge. */
export function Logo({ size = 40, className, title = 'Contrat Game' }: { size?: number; className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} role="img" aria-label={title}>
      <rect width="120" height="120" rx="26" fill={VINCI.bleu} />
      <g transform="rotate(-38 56 52)" fill={VINCI.blanc}>
        <rect x="30" y="36" width="52" height="24" rx="5" />
        <rect x="25" y="33" width="9" height="30" rx="3" />
        <rect x="78" y="33" width="9" height="30" rx="3" />
        <rect x="52" y="60" width="8" height="44" rx="3" />
      </g>
      <rect x="58" y="88" width="46" height="12" rx="3" fill={VINCI.rouge} />
    </svg>
  )
}
