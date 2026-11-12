'use client'
import { useState } from 'react'
import { Disclaimer } from './Disclaimer'
import { Sidebar, type UtilisateurShell } from './Sidebar'
import { Topbar } from './Topbar'

/** Coquille de l'application connectée : sidebar + barre du haut + bandeau + contenu défilant. */
export function AppShell({ children, utilisateur }: { children: React.ReactNode; utilisateur: UtilisateurShell }) {
  const [menuOuvert, setMenuOuvert] = useState(false)
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={menuOuvert} onClose={() => setMenuOuvert(false)} utilisateur={utilisateur} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMenuOuvert(true)} />
        <Disclaimer />
        <div id="contenu" className="flex-1 overflow-y-auto bg-white">
          {children}
        </div>
      </div>
    </div>
  )
}
