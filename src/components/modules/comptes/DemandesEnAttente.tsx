'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Clock, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { formatDateFR } from '@/lib/utils'
import { changerStatut } from '@/actions/comptes'
import type { CompteDTO } from './types'

/** Demandes de création de compte à valider par l'administrateur. */
export function DemandesEnAttente({ demandes }: { demandes: CompteDTO[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  if (demandes.length === 0) return null

  function decider(c: CompteDTO, statut: 'approuve' | 'refuse') {
    start(async () => {
      const res = await changerStatut(c.id, statut)
      if (!res.success) return void toast.error(res.error)
      toast.success(statut === 'approuve' ? `Compte de ${c.name} accepté` : `Demande de ${c.name} refusée`)
      router.refresh()
    })
  }

  return (
    <section className="mb-6 rounded-md border border-vinci-jaune bg-vinci-jaune-clair p-4">
      <h2 className="mb-3 flex items-center gap-2 font-bold text-vinci-bleu-fonce">
        <Clock className="h-5 w-5 text-vinci-jaune" />
        {demandes.length} demande{demandes.length > 1 ? 's' : ''} de compte en attente
      </h2>
      <ul className="space-y-2">
        {demandes.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-white p-3">
            <div className="min-w-0">
              <div className="font-semibold">{c.name}</div>
              <div className="text-sm text-vinci-texte-secondaire">
                {c.email}
                {c.entreprise ? ` · ${c.entreprise}` : ''} · demandé le {formatDateFR(c.createdAt)}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={pending} onClick={() => decider(c, 'approuve')}>
                <Check className="h-4 w-4" /> Accepter
              </Button>
              <Button size="sm" variant="destructive" disabled={pending} onClick={() => decider(c, 'refuse')}>
                <X className="h-4 w-4" /> Refuser
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-vinci-texte-secondaire">
        Un compte accepté n&apos;a accès à aucun projet tant qu&apos;il n&apos;y est pas ajouté (onglet Infos du projet → Membres).
      </p>
    </section>
  )
}
