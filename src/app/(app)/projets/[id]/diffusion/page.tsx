import { prisma } from '@/lib/prisma'
import { getProjetPourPage } from '@/lib/auth-helpers'
import { ListeDiffusion } from '@/components/modules/diffusion/ListeDiffusion'
import { versContactDTO } from '@/components/modules/diffusion/serveur'

export default async function DiffusionPage({ params }: { params: { id: string } }) {
  const { projet } = await getProjetPourPage(params.id)
  const [contacts, nbSousTraitants] = await Promise.all([
    prisma.contactDiffusion.findMany({ where: { projetId: params.id }, orderBy: [{ ordre: 'asc' }, { createdAt: 'asc' }] }),
    prisma.sousTraitant.count({ where: { projetId: params.id } }),
  ])
  return (
    <main className="p-6">
      <ListeDiffusion
        projetId={params.id}
        nomProjet={projet.name}
        contacts={contacts.map(versContactDTO)}
        aMoa={Boolean(projet.moaNom?.trim())}
        nbSousTraitants={nbSousTraitants}
      />
    </main>
  )
}
