import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDateFR } from '@/lib/utils'
import { NouveauProjet } from './NouveauProjet'

export default async function ProjetsPage({ searchParams }: { searchParams: { nouveau?: string } }) {
  const session = await auth()
  const projets = await prisma.projet.findMany({
    where: { members: { some: { userId: session!.user.id } } },
    orderBy: { updatedAt: 'desc' },
    include: { members: { where: { userId: session!.user.id } } },
  })
  return (
    <main className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="page-titre">Mes projets</h1>
        <NouveauProjet ouvertParDefaut={searchParams.nouveau === '1'} />
      </div>
      {projets.length === 0 ? (
        <p className="text-vinci-texte-secondaire">Aucun projet. Créez votre premier projet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projets.map((p) => (
            <Link
              key={p.id}
              href={`/projets/${p.id}/infos`}
              className="carte block border-l-4 border-l-vinci-bleu transition hover:bg-vinci-bleu-tres-clair"
            >
              <div className="font-bold text-vinci-bleu">{p.name}</div>
              {p.description && <div className="mt-1 line-clamp-2 text-sm text-vinci-texte-secondaire">{p.description}</div>}
              <div className="mt-3 flex justify-between text-xs text-vinci-texte-secondaire">
                <span>{p.numeroAffaire ? `Affaire ${p.numeroAffaire}` : ''}</span>
                <span>
                  {p.dateDebut ? formatDateFR(p.dateDebut) : ''}
                  {p.dateFin ? ` → ${formatDateFR(p.dateFin)}` : ''}
                </span>
              </div>
              <div className="mt-2 text-xs font-medium text-vinci-gris">{p.members[0]?.role === 'owner' ? 'Propriétaire' : 'Membre'}</div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
