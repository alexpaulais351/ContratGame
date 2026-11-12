import { prisma } from '@/lib/prisma'
import { getProjetPourPage } from '@/lib/auth-helpers'
import { OngletsDE } from '@/components/modules/detail-estimatif/OngletsDE'
import { Cotraitance } from '@/components/modules/detail-estimatif/Cotraitance'
import { lireRepartition, type CoTraitantClient, type LigneDEClient } from '@/components/modules/detail-estimatif/types'

export const metadata = { title: 'Co-traitance — Contrat Game' }

export default async function CotraitancePage({ params }: { params: { id: string } }) {
  const { projet } = await getProjetPourPage(params.id)
  const [lignes, cotraitants] = await Promise.all([
    prisma.ligneDE.findMany({ where: { projetId: projet.id }, orderBy: [{ ordre: 'asc' }, { id: 'asc' }] }),
    prisma.coTraitant.findMany({ where: { projetId: projet.id }, orderBy: [{ ordre: 'asc' }, { id: 'asc' }] }),
  ])
  const donnees: LigneDEClient[] = lignes.map((l) => ({
    id: l.id,
    code: l.code,
    designation: l.designation,
    unite: l.unite,
    quantite: l.quantite,
    prixUnitaire: l.prixUnitaire,
    estChapitre: l.estChapitre,
    repartition: lireRepartition(l.repartition),
    ordre: l.ordre,
  }))
  const cts: CoTraitantClient[] = cotraitants.map((c) => ({ id: c.id, nom: c.nom, estMandataire: c.estMandataire, ordre: c.ordre }))
  return (
    <div className="space-y-3">
      <OngletsDE projetId={projet.id} />
      <Cotraitance projetId={projet.id} lignes={donnees} cotraitantsInitiaux={cts} />
    </div>
  )
}
