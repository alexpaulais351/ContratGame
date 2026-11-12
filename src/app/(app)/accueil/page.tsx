import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BarChart3, FileText, FolderOpen, PlusCircle, UsersRound, type LucideIcon } from 'lucide-react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDateFR } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Logo } from '@/components/layout/Logo'
import { EbgcCouleur } from '@/components/layout/EbgcCouleur'
import { PresentationSite } from '@/components/modules/accueil/PresentationSite'

export const metadata = { title: 'Accueil — Contrat Game' }

type Action = { href: string; titre: string; texte: string; icon: LucideIcon }

export default async function AccueilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/login')

  const recents = await prisma.projet.findMany({
    where: { members: { some: { userId: user.id } } },
    orderBy: { updatedAt: 'desc' },
    take: 3,
    include: { _count: { select: { situations: true, courriers: true } } },
  })
  const demandes = user.role === 'admin' ? await prisma.user.count({ where: { statut: 'en_attente' } }) : 0

  const actions: Action[] = [
    { href: '/projets?nouveau=1', titre: 'Nouveau projet', texte: 'Créer un projet et choisir ses modules.', icon: PlusCircle },
    { href: '/projets', titre: 'Mes projets', texte: 'Retrouver et reprendre vos projets en cours.', icon: FolderOpen },
    { href: '/modeles-courriers', titre: 'Modèles de courriers', texte: 'Réserves, mise en demeure, prolongation de délai…', icon: FileText },
    ...(user.role === 'admin'
      ? [
          {
            href: '/comptes',
            titre: 'Comptes',
            texte: demandes ? `${demandes} demande${demandes > 1 ? 's' : ''} de compte en attente.` : 'Valider les demandes et gérer les comptes.',
            icon: UsersRound,
          },
          { href: '/analyse', titre: 'Analyse', texte: 'Fréquentation, comptes actifs et projets les plus consultés.', icon: BarChart3 },
        ]
      : []),
  ]

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 p-4 sm:p-6">
      <section className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <Logo size={128} className="h-24 w-24 shrink-0 rounded-[22px] sm:h-32 sm:w-32 sm:rounded-[28px]" />
        <div>
          <h1 className="text-3xl font-bold text-vinci-bleu">Contrat Game</h1>
          <p className="mt-2 text-black/80">Outil d&apos;aide à la gestion contractuelle et financière de vos chantiers.</p>
          <p className="mt-1 text-sm text-black/70">Bonjour {user.name}.</p>
        </div>
      </section>

      <section aria-label="Actions" className="grid gap-4 sm:grid-cols-2">
        {actions.map(({ href, titre, texte, icon: Icon }) => (
          <Link key={href} href={href} className="group min-h-11 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vinci-bleu">
            <Card className="flex h-full items-center gap-4 p-5 transition-colors group-hover:border-vinci-bleu">
              <Icon className="h-8 w-8 shrink-0 text-vinci-bleu" aria-hidden />
              <span>
                <span className="block text-lg font-semibold text-vinci-bleu group-hover:underline">{titre}</span>
                <span className="block text-sm text-black/70">{texte}</span>
              </span>
            </Card>
          </Link>
        ))}
      </section>

      {recents.length > 0 && (
        <section aria-label="Projets récents" className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-vinci-bleu">Projets récents</h2>
          <ul className="flex flex-col gap-2">
            {recents.map((p) => (
              <li key={p.id}>
                <Link href={`/projets/${p.id}/infos`} className="block min-h-11">
                  <Card className="flex flex-wrap items-center justify-between gap-2 p-4 hover:border-vinci-bleu">
                    <span className="truncate font-semibold text-vinci-bleu">{p.name}</span>
                    <span className="text-sm text-black/70">
                      {p._count.situations} situation{p._count.situations > 1 ? 's' : ''} · {p._count.courriers} courrier
                      {p._count.courriers > 1 ? 's' : ''} · modifié le {formatDateFR(p.updatedAt)}
                    </span>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <PresentationSite />

      <footer className="flex justify-center pb-2">
        <EbgcCouleur />
      </footer>
    </div>
  )
}
