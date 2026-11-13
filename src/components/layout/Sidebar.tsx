'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, FolderOpen, LifeBuoy, Home, LogOut, PlusCircle, ShieldCheck, UsersRound, Wrench, X, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { deconnexion } from '@/actions/auth'
import { Logo } from '@/components/layout/Logo'
import { ByEbgc } from '@/components/layout/ByEbgc'

export type UtilisateurShell = { nom: string; email: string; estAdmin: boolean; demandesEnAttente: number; ticketsNouveaux?: number }

type Lien = { href: string; label: string; icon: LucideIcon; badge?: number; badgeTexte?: string; sous?: Lien[] }

const LIENS: Lien[] = [
  { href: '/accueil', label: 'Accueil', icon: Home },
  { href: '/projets', label: 'Projets', icon: FolderOpen, sous: [{ href: '/projets?nouveau=1', label: 'Nouveau projet', icon: PlusCircle }] },
  { href: '/boite-a-outils', label: 'Boîte à outils', icon: Wrench },
  { href: '/assurances', label: 'Assurances', icon: ShieldCheck },
]

type Props = { open: boolean; onClose: () => void; utilisateur: UtilisateurShell }

export function Sidebar({ open, onClose, utilisateur }: Props) {
  const pathname = usePathname()
  const liens: Lien[] = utilisateur.estAdmin
    ? [
        ...LIENS,
        { href: '/tickets', label: 'Tickets', icon: LifeBuoy, badge: utilisateur.ticketsNouveaux, badgeTexte: 'nouveau' },
        { href: '/comptes', label: 'Comptes', icon: UsersRound, badge: utilisateur.demandesEnAttente, badgeTexte: 'à valider' },
        { href: '/analyse', label: 'Analyse', icon: BarChart3 },
      ]
    : [...LIENS, { href: '/tickets', label: 'Mes demandes', icon: LifeBuoy }]

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} aria-hidden />}
      <aside
        id="navigation-principale"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-vinci-bleu text-white transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-start justify-between border-b border-white/20 px-4 py-5">
          <Link href="/accueil" onClick={onClose} className="flex items-center gap-3">
            <Logo size={36} className="shrink-0 rounded-[9px] ring-1 ring-white/60" />
            <span className="block">
              <span className="block text-base font-bold tracking-wide">CONTRAT GAME</span>
              <span className="mt-1 block text-xs text-white/70">Gestion contractuelle de chantier</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-white/70 hover:bg-vinci-bleu-fonce hover:text-white lg:hidden"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3" aria-label="Navigation principale">
          {liens.map(({ href, label, icon: Icon, badge, badgeTexte, sous }) => {
            const chemin = href.split('?')[0]
            const actif = href.includes('?') ? false : pathname === chemin || pathname.startsWith(chemin + '/')
            return (
              <div key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  aria-current={actif ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 border-l-4 px-4 py-3 text-sm transition-colors hover:bg-vinci-bleu-fonce',
                    actif ? 'border-vinci-rouge bg-vinci-bleu-fonce font-semibold text-white' : 'border-transparent text-white/70 hover:text-white',
                  )}
                >
                  <span className="relative shrink-0">
                    <Icon className="h-4 w-4" aria-hidden />
                    {badge ? (
                      <span className="absolute -right-1.5 -top-1.5 flex h-2.5 w-2.5" aria-hidden>
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vinci-rouge opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-vinci-rouge ring-2 ring-vinci-bleu" />
                      </span>
                    ) : null}
                  </span>
                  {label}
                  {badge ? (
                    <span
                      className="ml-auto flex items-center gap-1 rounded-full bg-vinci-rouge px-2 py-0.5 text-[11px] font-bold text-white shadow"
                      title={`${badge} ${badgeTexte ?? ''}`}
                      aria-label={`${label} : ${badge} ${badgeTexte ?? ''}`}
                    >
                      {badge} {badgeTexte === 'nouveau' && badge > 1 ? 'nouveaux' : badgeTexte}
                    </span>
                  ) : null}
                </Link>
                {sous && (
                  <ul className="mb-1" aria-label={`Sous-menu ${label}`}>
                    {sous.map(({ href: h, label: l, icon: SousIcon }) => (
                      <li key={h}>
                        <Link
                          href={h}
                          onClick={onClose}
                          className="ml-6 flex items-center gap-2.5 border-l border-white/25 py-2 pl-4 pr-4 text-[13px] text-white/70 transition-colors hover:bg-vinci-bleu-fonce hover:text-white"
                        >
                          <SousIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          {l}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </nav>

        <div className="px-4 pb-3">
          <ByEbgc />
        </div>
        <div className="border-t border-white/20 px-4 py-3 text-sm">
          <Link href="/profil" onClick={onClose} className="block rounded hover:text-white">
            <div className="truncate font-semibold">{utilisateur.nom}</div>
            <div className="truncate text-xs text-white/70">{utilisateur.email}</div>
          </Link>
          <form action={deconnexion} className="mt-2">
            <button
              type="submit"
              className="flex items-center gap-2 rounded px-1 py-1 text-xs text-white/70 hover:bg-vinci-bleu-fonce hover:text-white"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
