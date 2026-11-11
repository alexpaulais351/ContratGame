import { prisma } from '@/lib/prisma'
import { getProjetPourPage } from '@/lib/auth-helpers'
import { OngletsDE } from '@/components/modules/detail-estimatif/OngletsDE'
import { TableauDE } from '@/components/modules/detail-estimatif/TableauDE'
import { lireRepartition, type LigneDEClient } from '@/components/modules/detail-estimatif/types'

export const metadata = { title: 'Détail Estimatif — Contrat Game' }

export default async function DetailEstimatifPage({ params }: { params: { id: string } }) {
  const { projet } = await getProjetPourPage(params.id)
  const lignes = await prisma.ligneDE.findMany({ where: { projetId: projet.id }, orderBy: [{ ordre: 'asc' }, { id: 'asc' }] })
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
  return (
    <div className="space-y-3">
      <OngletsDE projetId={projet.id} />
      <TableauDE projetId={projet.id} nomProjet={projet.name} lignesInitiales={donnees} />
    </div>
  )
}
