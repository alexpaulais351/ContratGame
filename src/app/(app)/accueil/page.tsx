import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FileText, FolderOpen, LayoutDashboard, PlusCircle, Users } from 'lucide-react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDateFR } from '@/lib/utils'
import { Logo } from '@/components/layout/Logo'
import { ByEbgc } from '@/components/layout/ByEbgc'
import { PresentationSite } from '@/components/modules/accueil/PresentationSite'

export const metadata = { title: 'Accueil — Contrat Game' }

export default async function AccueilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/login')

  const projets = await prisma.projet.findMany({
    where: { members: { some: { userId: user.id } } },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    include: { _count: { select: { situations: true, courriers: true } } },
  })

  const tuiles = [
    { href: '/projets?nouveau=1', titre: 'Nouveau projet', texte: 'Créer un projet et paramétrer ses modules.', icon: PlusCircle },
    { href: '/projets', titre: 'Mes projets', texte: 'Retrouver et reprendre vos projets en cours.', icon: FolderOpen },
    { href: '/tableau-de-bord', titre: 'Tableau de bord', texte: 'Synthèse financière de tous vos projets.', icon: LayoutDashboard },
    { href: '/modeles-courriers', titre: 'Modèles de courriers', texte: 'Réserves, mise en demeure, prolongation de délai…', icon: FileText },
    ...(user.role === 'admin'
      ? [{ href: '/comptes', titre: 'Comptes', texte: 'Créer et gérer les comptes des utilisateurs.', icon: Users }]
      : []),
  ]

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-center gap-5">
        <Logo size={88} className="shrink-0 rounded-[20px]" />
        <div>
          <h1 className="text-2xl font-black text-vinci-bleu">Contrat Game</h1>
          <p className="text-vinci-texte-secondaire">
            Outil de gestion contractuelle et financière de chantier : courriers, journal, détail estimatif, situations,
            prix nouveaux, sous-traitance et consultation fournisseurs.
          </p>
          <p className="mt-1 text-vinci-texte-secondaire">Bonjour {user.name}.</p>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {tuiles.map(({ href, titre, texte, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="carte flex items-center gap-4 transition hover:border-vinci-bleu hover:bg-vinci-bleu-tres-clair"
          >
            <Icon className="h-6 w-6 shrink-0 text-vinci-bleu" />
            <span>
              <span className="block font-bold text-vinci-bleu">{titre}</span>
              <span className="block text-sm text-vinci-texte-secondaire">{texte}</span>
            </span>
          </Link>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-lg font-bold text-vinci-bleu">Projets récents</h2>
        {projets.length === 0 ? (
          <p className="text-sm text-vinci-texte-secondaire">
            Aucun projet pour l&apos;instant.{' '}
            <Link href="/projets?nouveau=1" className="font-bold text-vinci-bleu underline">
              Créer un projet
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {projets.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projets/${p.id}/infos`}
                  className="carte flex items-center justify-between gap-4 py-3 transition hover:bg-vinci-bleu-tres-clair"
                >
                  <span className="truncate font-bold text-vinci-bleu">{p.name}</span>
                  <span className="shrink-0 text-xs text-vinci-texte-secondaire">
                    {p._count.situations} situation{p._count.situations > 1 ? 's' : ''} · {p._count.courriers} courrier
                    {p._count.courriers > 1 ? 's' : ''} · modifié le {formatDateFR(p.updatedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PresentationSite />

      <footer className="mt-10 flex justify-center">
        <ByEbgc variante="sombre" />
      </footer>
    </main>
  )
}
