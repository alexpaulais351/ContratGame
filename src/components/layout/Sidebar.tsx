'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, FolderKanban, Home, LayoutDashboard, LogOut, UserCircle, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { deconnexion } from '@/actions/auth'
import { Logo } from '@/components/layout/Logo'
import { ByEbgc } from '@/components/layout/ByEbgc'

type Props = { nomUtilisateur: string; email: string; estAdmin: boolean }

export function Sidebar({ nomUtilisateur, email, estAdmin }: Props) {
  const pathname = usePathname()
  const items = [
    { href: '/accueil', label: 'Accueil', icon: Home },
    { href: '/projets', label: 'Projets', icon: FolderKanban },
    { href: '/tableau-de-bord', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/modeles-courriers', label: 'Modèles de courriers', icon: FileText },
    ...(estAdmin ? [{ href: '/comptes', label: 'Comptes', icon: Users }] : []),
  ]
  const actif = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col bg-vinci-bleu text-white lg:w-60">
      <Link href="/accueil" className="flex items-center justify-center gap-2.5 px-3 py-4 lg:justify-start">
        <Logo size={36} className="shrink-0 rounded-[9px] ring-2 ring-white" />
        <span className="hidden leading-tight lg:block">
          <span className="block text-base font-black tracking-wider">CONTRAT GAME</span>
          <span className="block text-[11px] opacity-80">Gestion contractuelle de chantier</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-0.5 overflow-y-auto py-2">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            title={label}
            className={cn(
              'flex items-center gap-3 border-l-4 px-4 py-2.5 text-sm hover:bg-vinci-bleu-fonce',
              actif(href) ? 'border-vinci-rouge bg-vinci-bleu-fonce font-bold' : 'border-transparent',
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="hidden truncate lg:inline">{label}</span>
          </Link>
        ))}
      </nav>

      <div className="hidden px-4 pb-3 lg:block">
        <ByEbgc />
      </div>
      <div className="border-t border-vinci-bleu-fonce">
        <Link
          href="/profil"
          title={nomUtilisateur}
          className={cn(
            'flex items-center gap-3 border-l-4 px-4 py-3 hover:bg-vinci-bleu-fonce',
            actif('/profil') ? 'border-vinci-rouge bg-vinci-bleu-fonce' : 'border-transparent',
          )}
        >
          <UserCircle className="h-5 w-5 shrink-0" />
          <span className="hidden min-w-0 lg:block">
            <span className="block truncate text-sm font-bold">{nomUtilisateur}</span>
            <span className="block truncate text-[11px] opacity-80">{email}</span>
          </span>
        </Link>
        <form action={deconnexion}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 border-l-4 border-transparent px-4 py-2.5 text-sm hover:bg-vinci-bleu-fonce"
            title="Se déconnecter"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="hidden lg:inline">Se déconnecter</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
