import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BibliothequeModeles } from '@/components/modules/modeles-courriers/BibliothequeModeles'
import { EncadreSources } from '@/components/modules/boite-a-outils/EncadreSources'

export const metadata = { title: 'Modèles de courriers — Boîte à outils' }

export default async function ModelesCourriersPage({ searchParams }: { searchParams: { modele?: string | string[] } }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const projets = await prisma.projet.findMany({
    where: { members: { some: { userId: session.user.id } } },
    select: { id: true, name: true, numeroAffaire: true },
    orderBy: { name: 'asc' },
  })
  return (
    <>
      <h2 className="page-titre">Modèles de courriers</h2>
      <p className="mb-6 text-sm text-vinci-texte-secondaire">
        Bibliothèque des courriers types : consultez, copiez, exportez en Word ou utilisez un modèle dans l’un de vos projets.
      </p>
      <BibliothequeModeles
        modeleInitial={typeof searchParams.modele === 'string' ? searchParams.modele : undefined}
        projets={projets.map((p) => ({ id: p.id, nom: p.name, numeroAffaire: p.numeroAffaire }))} />
      <EncadreSources outil="modeles-courriers" />
    </>
  )
}
