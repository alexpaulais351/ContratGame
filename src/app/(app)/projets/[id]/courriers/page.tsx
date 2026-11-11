import { prisma } from '@/lib/prisma'
import { getProjetPourPage } from '@/lib/auth-helpers'
import { ListeCourriers } from '@/components/modules/courriers/ListeCourriers'

export default async function CourriersPage({ params }: { params: { id: string } }) {
  await getProjetPourPage(params.id)
  const courriers = await prisma.courrierChantier.findMany({
    where: { projetId: params.id },
    orderBy: [{ dateEnvoi: { sort: 'desc', nulls: 'first' } }, { createdAt: 'desc' }],
  })
  return (
    <main className="p-6">
      <ListeCourriers
        projetId={params.id}
        courriers={courriers.map((c) => ({
          id: c.id, reference: c.reference, objet: c.objet, type: c.type, destinataire: c.destinataire,
          statut: c.statut === 'envoye' ? 'envoye' : 'brouillon', dateEnvoi: c.dateEnvoi?.toISOString() ?? null,
          createdAt: c.createdAt.toISOString(),
        }))}
      />
    </main>
  )
}
