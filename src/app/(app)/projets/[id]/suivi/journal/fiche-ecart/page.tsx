import { prisma } from '@/lib/prisma'
import { getProjetPourPage } from '@/lib/auth-helpers'
import { FicheEcartClient, type EvenementImportable } from '@/components/modules/journal/FicheEcartClient'
import { versJour } from '@/components/modules/journal/types'

export default async function FicheEcartPage({ params }: { params: { id: string } }) {
  const { projet } = await getProjetPourPage(params.id)
  const [lignes, evenements] = await Promise.all([
    prisma.ligneFicheEcart.findMany({
      where: { projetId: projet.id },
      orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        evenementId: true,
        etude: true,
        prevuDCE: true,
        phaseTransitoire: true,
        exe: true,
        impacts: true,
        delaisImpactes: true,
        coutImpactes: true,
        ordre: true,
        chapitre: true,
        estChapitre: true,
      },
    }),
    prisma.evenementChantier.findMany({
      where: { projetId: projet.id },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, date: true, titre: true, description: true, categorieRel: { select: { nom: true, couleurPoint: true } }, categorie: true },
    }),
  ])

  const evs: EvenementImportable[] = evenements.map((e) => ({
    id: e.id,
    jour: versJour(e.date),
    titre: e.titre,
    description: e.description,
    categorie: e.categorieRel?.nom ?? (e.categorie || null),
    couleur: e.categorieRel?.couleurPoint ?? null,
  }))

  return <FicheEcartClient projetId={projet.id} nomProjet={projet.name} initial={lignes} evenements={evs} />
}
