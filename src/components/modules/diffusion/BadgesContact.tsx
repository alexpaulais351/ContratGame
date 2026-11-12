import { Badge } from '@/components/ui/badge'
import type { ContactDiffusionDTO } from './contacts'

const BASE = 'whitespace-nowrap border px-1.5 py-0 text-[11px] font-semibold'

/** Badges « Destinataire par défaut » / « Copie par défaut » / « Diffusion infos chantier » (couleurs sémantiques VINCI). */
export function BadgesContact({ contact }: { contact: Pick<ContactDiffusionDTO, 'destinataireParDefaut' | 'copieParDefaut' | 'diffusionCR'> }) {
  return (
    <div className="flex flex-wrap gap-1">
      {contact.destinataireParDefaut && (
        <Badge className={`${BASE} border-vinci-bleu bg-vinci-bleu text-white hover:bg-vinci-bleu`}>Destinataire par défaut</Badge>
      )}
      {contact.copieParDefaut && (
        <Badge className={`${BASE} border-vinci-bleu-moyen bg-vinci-bleu-moyen-clair text-vinci-bleu-fonce hover:bg-vinci-bleu-moyen-clair`}>Copie par défaut</Badge>
      )}
      {contact.diffusionCR && (
        <Badge className={`${BASE} border-vinci-vert bg-vinci-vert-clair text-black hover:bg-vinci-vert-clair`}>Diffusion infos chantier</Badge>
      )}
    </div>
  )
}
