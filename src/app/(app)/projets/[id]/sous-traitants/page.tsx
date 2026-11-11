import { prisma } from '@/lib/prisma'
import { getProjetPourPage } from '@/lib/auth-helpers'
import { FichesSousTraitants, type STFiche } from '@/components/modules/sous-traitants/FichesSousTraitants'

export default async function SousTraitantsPage({ params }: { params: { id: string } }) {
  await getProjetPourPage(params.id)
  const sts = await prisma.sousTraitant.findMany({
    where: { projetId: params.id },
    orderBy: [{ ordre: 'asc' }, { nom: 'asc' }],
    include: { avenants: { orderBy: { id: 'asc' } } },
  })
  const data: STFiche[] = sts.map((s) => ({
    id: s.id, nom: s.nom, contact: s.contact, telephone: s.telephone, email: s.email,
    paiementDirect: s.paiementDirect, montantMarche: s.montantMarche, montantAS: s.montantAS, commentaire: s.commentaire,
    avenants: s.avenants.map((a) => ({ id: a.id, numero: a.numero, libelle: a.libelle, montant: a.montant, date: a.date ? a.date.toISOString() : null })),
  }))
  return (
    <main className="p-6">
      <FichesSousTraitants projetId={params.id} sousTraitants={data} />
    </main>
  )
}
