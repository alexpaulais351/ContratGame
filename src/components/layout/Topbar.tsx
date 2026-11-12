import Link from 'next/link'
import { Menu, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-vinci-gris-bordure bg-white px-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Ouvrir le menu"
          aria-controls="navigation-principale"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-sm font-semibold text-vinci-bleu lg:hidden">CONTRAT GAME</span>
      </div>
      <Button asChild variant="outline" size="sm" className="btn-secondaire">
        <Link href="/profil">
          <UserRound />
          Profil
        </Link>
      </Button>
    </header>
  )
}
