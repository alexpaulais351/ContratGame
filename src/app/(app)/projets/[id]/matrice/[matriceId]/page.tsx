import { notFound } from 'next/navigation'
import { getProjetPourPage } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { versMatriceVue } from '@/components/modules/matrice/types'
import { EditeurMatrice } from '@/components/modules/matrice/EditeurMatrice'

export default async function MatriceDetailPage({ params }: { params: { id: string; matriceId: string } }) {
  const { projet } = await getProjetPourPage(params.id)
  const m = await prisma.matriceDecisionnelle.findFirst({
    where: { id: params.matriceId, projetId: projet.id },
    include: {
      fournisseurs: { orderBy: { rang: 'asc' } },
      criteres: { orderBy: { ordre: 'asc' }, include: { notations: true } },
    },
  })
  if (!m) notFound()

  return <EditeurMatrice projetId={projet.id} nomProjet={projet.name} initiale={versMatriceVue(m)} />
}
