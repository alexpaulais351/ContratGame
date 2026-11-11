import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BibliothequeModeles } from '@/components/modules/modeles-courriers/BibliothequeModeles'

export default async function ModelesCourriersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const projets = await prisma.projet.findMany({
    where: { members: { some: { userId: session.user.id } } },
    select: { id: true, name: true, numeroAffaire: true },
    orderBy: { name: 'asc' },
  })
  return (
    <main className="p-6">
      <h1 className="page-titre">Modèles de courriers</h1>
      <p className="mb-6 text-sm text-vinci-texte-secondaire">
        Bibliothèque des courriers types : consultez, copiez ou utilisez un modèle dans l’un de vos projets.
      </p>
      <BibliothequeModeles projets={projets.map((p) => ({ id: p.id, nom: p.name, numeroAffaire: p.numeroAffaire }))} />
    </main>
  )
}
