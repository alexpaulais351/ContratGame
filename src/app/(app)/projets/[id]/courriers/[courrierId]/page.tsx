import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getProjetPourPage } from '@/lib/auth-helpers'
import { EditeurCourrier } from '@/components/modules/courriers/EditeurCourrier'

export default async function CourrierPage({ params }: { params: { id: string; courrierId: string } }) {
  const { projet } = await getProjetPourPage(params.id)
  const c = await prisma.courrierChantier.findFirst({
    where: { id: params.courrierId, projetId: params.id },
    include: { evenements: { select: { id: true }, take: 1 } },
  })
  if (!c) notFound()
  return (
    <main className="p-6">
      <EditeurCourrier
        nomProjet={projet.name}
        initial={{
          id: c.id, projetId: c.projetId, reference: c.reference, objet: c.objet, type: c.type,
          dateEnvoi: c.dateEnvoi?.toISOString() ?? null, destinataire: c.destinataire, expediteur: c.expediteur,
          corps: c.corps, statut: c.statut === 'envoye' ? 'envoye' : 'brouillon', lieu: c.lieu ?? '', modeEnvoi: c.modeEnvoi ?? '',
          copies: c.copies ?? '', signataireNom: c.signataireNom ?? '', signataireFonction: c.signataireFonction ?? '',
          evenementId: c.evenements[0]?.id ?? null,
        }}
      />
    </main>
  )
}
