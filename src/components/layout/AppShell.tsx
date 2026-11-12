'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Menu, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Disclaimer } from './Disclaimer'
import { Ruban } from './Ruban'
import { Sidebar, type UtilisateurShell } from './Sidebar'
import { SuiviVisites } from './SuiviVisites'

/** Coquille connectée : sidebar + bandeau illustré en haut (Profil) + avertissement + contenu défilant. */
export function AppShell({ children, utilisateur }: { children: React.ReactNode; utilisateur: UtilisateurShell }) {
  const [menuOuvert, setMenuOuvert] = useState(false)
  return (
    <div className="flex h-screen overflow-hidden">
      <SuiviVisites />
      <Sidebar open={menuOuvert} onClose={() => setMenuOuvert(false)} utilisateur={utilisateur} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Ruban
          variante="bandeau"
          gauche={
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-vinci-bleu-fonce hover:text-white lg:hidden"
              onClick={() => setMenuOuvert(true)}
              aria-label="Ouvrir le menu"
              aria-controls="navigation-principale"
            >
              <Menu className="h-5 w-5" />
            </Button>
          }
          droite={
            <Button asChild variant="outline" size="sm" className="btn-secondaire shadow-sm">
              <Link href="/profil">
                <UserRound />
                Profil
              </Link>
            </Button>
          }
        />
        <Disclaimer />
        <div id="contenu" className="flex-1 overflow-y-auto bg-white">
          {children}
        </div>
      </div>
    </div>
  )
}
