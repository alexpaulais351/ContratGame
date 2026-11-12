import { DECISIONS, STATUTS_MATRICE, type DecisionFournisseur } from '@/lib/matrice-bidcomp'
import { cn } from '@/lib/utils'

export function BadgeDecision({ decision, className }: { decision: string; className?: string }) {
  const d = DECISIONS[(decision in DECISIONS ? decision : 'en_attente') as DecisionFournisseur]
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[12px] font-bold uppercase', className)}
      style={{ backgroundColor: d.fond, borderColor: d.couleur, color: decision === 'en_attente' ? '#000000' : d.couleur }}
    >
      <span className="size-2 rounded-full" style={{ backgroundColor: d.couleur }} />
      {d.label}
    </span>
  )
}

const STYLES_STATUT: Record<string, string> = {
  brouillon: 'border-vinci-gris bg-vinci-gris-clair text-vinci-texte-secondaire',
  en_cours: 'border-vinci-bleu-moyen bg-vinci-bleu-moyen-clair text-vinci-bleu-fonce',
  finalisee: 'border-vinci-vert bg-vinci-vert-clair text-black',
}

export function BadgeStatut({ statut }: { statut: string }) {
  const label = STATUTS_MATRICE.find((s) => s.value === statut)?.label ?? statut
  return <span className={cn('inline-block rounded-sm border px-1.5 py-0.5 text-[12px] font-medium', STYLES_STATUT[statut] ?? STYLES_STATUT.brouillon)}>{label}</span>
}
