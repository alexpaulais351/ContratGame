import { prisma } from '@/lib/prisma'
import { getProjetPourPage } from '@/lib/auth-helpers'
import { ListeSituations } from '@/components/modules/situations/ListeSituations'
import type { SituationListeItem } from '@/components/modules/situations/types'

export default async function SituationsPage({ params }: { params: { id: string } }) {
  const { projet } = await getProjetPourPage(params.id)
  const situations = await prisma.situation.findMany({
    where: { projetId: projet.id },
    orderBy: { numero: 'asc' },
    include: { lignes: { select: { quantite: true, prixUnitaire: true } } },
  })
  let precedent = 0
  const items: SituationListeItem[] = situations.map((s) => {
    const cumul = s.lignes.reduce((a, l) => a + l.quantite * l.prixUnitaire, 0)
    const it: SituationListeItem = {
      id: s.id, numero: s.numero, libelle: s.libelle, annee: s.annee, mois: s.mois,
      statut: s.statut === 'validee' ? 'validee' : 'brouillon',
      montantCumule: cumul, montantMois: cumul - precedent,
    }
    precedent = cumul
    return it
  })
  const now = new Date()
  return (
    <ListeSituations
      projetId={projet.id}
      situations={items}
      anneeDefaut={now.getFullYear()}
      moisDefaut={now.getMonth() + 1}
    />
  )
}
