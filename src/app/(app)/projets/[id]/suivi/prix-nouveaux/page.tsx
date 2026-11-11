import { prisma } from '@/lib/prisma'
import { getProjetPourPage } from '@/lib/auth-helpers'
import { PrixNouveauxClient } from '@/components/modules/prix-nouveaux/PrixNouveauxClient'
import type { PrixNouveauDTO } from '@/components/modules/prix-nouveaux/types'

export default async function PrixNouveauxPage({ params }: { params: { id: string } }) {
  const { projet } = await getProjetPourPage(params.id)
  const lignes = await prisma.prixNouveau.findMany({
    where: { projetId: projet.id },
    orderBy: [{ ordre: 'asc' }, { numero: 'asc' }],
  })
  const initial: PrixNouveauDTO[] = lignes.map((l) => ({
    id: l.id,
    numero: l.numero,
    intitule: l.intitule,
    dateDevis: l.dateDevis ? l.dateDevis.toISOString().slice(0, 10) : '',
    montantPresente: l.montantPresente,
    montantAccepte: l.montantAccepte,
    debourseReel: l.debourseReel,
    numeroOS: l.numeroOS ?? '',
    dateOS: l.dateOS ? l.dateOS.toISOString().slice(0, 10) : '',
    delaiSupplementaire: l.delaiSupplementaire ?? '',
    potentielAcceptation: l.potentielAcceptation,
    statut: l.statut,
    commentaire: l.commentaire ?? '',
  }))
  return (
    <main className="p-4 md:p-6">
      <PrixNouveauxClient projetId={projet.id} nomProjet={projet.name} initial={initial} />
    </main>
  )
}
