import { MENTION_VERSION_CCAG } from '@/lib/boite-a-outils/sources'
import { BoiteOutilsNav } from '@/components/modules/boite-a-outils/BoiteOutilsNav'

export const metadata = { title: 'Boîte à outils — Contrat Game' }

export default function BoiteOutilsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <header className="sticky top-0 z-30 border-b border-vinci-gris-bordure bg-white">
        <div className="px-4 pb-2 pt-4 lg:px-6">
          <h1 className="page-titre">Boîte à outils</h1>
          <p className="text-xs text-vinci-texte-secondaire">
            Aide-mémoire du conducteur de travaux. Référence : {MENTION_VERSION_CCAG} ; codes en vigueur (voir « Sources et versions » en bas de page).
          </p>
        </div>
        <BoiteOutilsNav />
      </header>
      <main className="p-4 lg:p-6">{children}</main>
    </div>
  )
}
