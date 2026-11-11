import { redirect } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { estAdmin } from '@/lib/est-admin'
import { ListeComptes } from '@/components/modules/comptes/ListeComptes'
import { NouveauCompte } from '@/components/modules/comptes/NouveauCompte'
import type { CompteDTO } from '@/components/modules/comptes/types'

export const dynamic = 'force-dynamic'

export default async function ComptesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const moiId = session.user.id

  if (!(await estAdmin(moiId))) {
    return (
      <main className="p-6">
        <h1 className="page-titre">Comptes utilisateurs</h1>
        <div className="carte mt-6 flex max-w-xl items-center gap-3 border-l-4 border-l-vinci-rouge bg-vinci-rouge-tres-clair">
          <ShieldAlert className="h-6 w-6 shrink-0 text-vinci-rouge" />
          <p className="font-medium">Accès réservé aux administrateurs.</p>
        </div>
      </main>
    )
  }

  const [users, projets] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { memberships: true } } },
    }),
    prisma.projet.findMany({
      where: { members: { some: { userId: moiId } } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const comptes: CompteDTO[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role === 'admin' ? 'admin' : 'user',
    nbProjets: u._count.memberships,
    createdAt: u.createdAt.toISOString(),
  }))

  return (
    <main className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-titre">Comptes utilisateurs</h1>
          <p className="text-sm text-vinci-texte-secondaire">
            {comptes.length} compte{comptes.length > 1 ? 's' : ''} — création, réinitialisation des mots de passe, rôles et suppression.
          </p>
        </div>
        <NouveauCompte projets={projets.map((p) => ({ id: p.id, nom: p.name }))} />
      </div>
      <ListeComptes comptes={comptes} moiId={moiId} />
    </main>
  )
}
