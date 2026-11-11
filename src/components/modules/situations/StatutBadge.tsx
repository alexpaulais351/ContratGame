import { SEMANTIQUE } from '@/lib/design-tokens'

export function StatutBadge({ statut }: { statut: 'brouillon' | 'validee' }) {
  const c = statut === 'validee' ? SEMANTIQUE.succes : SEMANTIQUE.avertissement
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-black"
      style={{ backgroundColor: c.clair, borderColor: c.base }}
    >
      {statut === 'validee' ? 'Validée' : 'Brouillon'}
    </span>
  )
}
