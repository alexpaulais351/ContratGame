import { cn } from '@/lib/utils'

export function BadgeStatutCourrier({ statut }: { statut: string }) {
  const envoye = statut === 'envoye'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        envoye ? 'bg-vinci-vert-clair text-vinci-vert' : 'bg-vinci-jaune-clair text-vinci-orange'
      )}
    >
      {envoye ? 'Envoyé' : 'Brouillon'}
    </span>
  )
}
