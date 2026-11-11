import { VINCI } from '@/lib/design-tokens'

/** Logo Contrat Game : document + coche (contrat validé). */
export function Logo({ size = 40, className, title = 'Contrat Game' }: { size?: number; className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} role="img" aria-label={title}>
      <rect width="120" height="120" rx="24" fill={VINCI.bleu} />
      <path d="M30 18 h36 l18 18 v60 a6 6 0 0 1-6 6 h-48 a6 6 0 0 1-6-6 v-72 a6 6 0 0 1 6-6z" fill="none" stroke={VINCI.blanc} strokeWidth="7" strokeLinejoin="round" />
      <path d="M66 18 v18 h18" fill="none" stroke={VINCI.blanc} strokeWidth="7" strokeLinejoin="round" />
      <path d="M38 46 h22 M38 60 h34 M38 74 h16" stroke={VINCI.blanc} strokeWidth="5" strokeLinecap="round" />
      <circle cx="84" cy="84" r="20" fill={VINCI.rouge} stroke={VINCI.bleu} strokeWidth="4" />
      <path d="M75 84 l6 6 l12-13" stroke={VINCI.blanc} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
