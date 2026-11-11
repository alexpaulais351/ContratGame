'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FolderKanban, LogOut, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { deconnexion } from '@/actions/auth'

export function Sidebar({ nomUtilisateur }: { nomUtilisateur: string }) {
  const pathname = usePathname()
  const items = [
    { href: '/projets', label: 'Projets', icon: FolderKanban },
    { href: '/profil', label: nomUtilisateur, icon: UserCircle },
  ]
  return (
    <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col bg-vinci-bleu text-white lg:w-56">
      <div className="px-3 py-4 text-center text-sm font-black tracking-wider lg:text-left lg:text-lg">
        <span className="hidden lg:inline">CONDUC RAIL</span>
        <span className="lg:hidden">CR</span>
      </div>
      <nav className="flex-1 space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const actif = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                'flex items-center gap-3 border-l-4 px-4 py-2.5 text-sm hover:bg-vinci-bleu-fonce',
                actif ? 'border-vinci-rouge bg-vinci-bleu-fonce font-bold' : 'border-transparent',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="hidden truncate lg:inline">{label}</span>
            </Link>
          )
        })}
      </nav>
      <form action={deconnexion}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 border-l-4 border-transparent px-4 py-3 text-sm hover:bg-vinci-bleu-fonce"
          title="Se déconnecter"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="hidden lg:inline">Déconnexion</span>
        </button>
      </form>
    </aside>
  )
}
